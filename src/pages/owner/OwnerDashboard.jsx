import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import styles from './OwnerDashboard.module.css';
import { API_URL as API } from '../../config';

const STATUS_MAP = {
  activo:    { key: 'own.statusActive',  cls: 'pActive'  },
  pendiente: { key: 'own.statusPending', cls: 'pPending' },
  borrador:  { key: 'own.statusDraft',   cls: 'pDraft'   },
  vendido:   { key: 'own.statusSold',    cls: 'pSold'    },
};
const STAGE_BY_STATUS = { borrador: 0, pendiente: 1, activo: 2, vendido: 3 };

function authHeaders() {
  const token = localStorage.getItem('access');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { t }    = useI18n();
  const [activeNav, setActiveNav]   = useState('properties');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);

  const loadProperties = () => {
    fetch(`${API}/properties/mine/`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setProperties(data.results || data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadProperties(); }, []);

  // Polling: refresca cada 30s para reflejar cambios de estado del empleado
  useEffect(() => {
    const interval = setInterval(loadProperties, 30000);
    return () => clearInterval(interval);
  }, []);

  const NAV_ITEMS = [
    { id: 'properties', label: t('own.myProps') },
    { id: 'register',   label: t('own.register') },
    { id: 'settings',   label: t('own.settings') },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.profile}>
          <div className={styles.profileAvatar}>
            {(user?.name || user?.email || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className={styles.profileName}>{user?.name || user?.email}</div>
          <div className={styles.profileRole}>
            {t('register.owner')} · {properties.length}
          </div>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              className={`${styles.navItem} ${activeNav === item.id ? styles.navActive : ''}`}
              onClick={() => setActiveNav(item.id)}>
              <span className={styles.navDot} />{item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        {activeNav === 'properties' && (
          <PropertiesView properties={properties} loading={loading}
            onRegister={() => setActiveNav('register')} onRefresh={loadProperties} />
        )}
        {activeNav === 'register' && (
          <RegisterForm onSuccess={() => { loadProperties(); setActiveNav('properties'); }} />
        )}
        {activeNav === 'settings' && <SettingsView />}
        {!['properties', 'register', 'settings'].includes(activeNav) && (
          <PlaceholderView label={NAV_ITEMS.find(n => n.id === activeNav)?.label} />
        )}
      </main>
    </div>
  );
}

function PropertiesView({ properties, loading, onRegister, onRefresh }) {
  const { t } = useI18n();
  if (loading) return <div className={styles.page}><div className={styles.loadingMsg}>...</div></div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('own.myProps')}</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={styles.btnGhost} onClick={onRefresh}>{t('own.update')}</button>
          <button className={styles.btnPrimary} onClick={onRegister}>{t('own.registerBtn')}</button>
        </div>
      </div>
      {properties.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t('own.noProps')}</p>
          <button className={styles.btnPrimary} onClick={onRegister} style={{ marginTop: 16 }}>
            {t('own.firstProp')}
          </button>
        </div>
      ) : (
        properties.map(p => <PropertyCard key={p.id} property={p} />)
      )}
    </div>
  );
}

function PropertyCard({ property }) {
  const { t } = useI18n();
  const [messages, setMessages]               = useState([]);
  const [msgInput, setMsgInput]               = useState('');
  const [showChat, setShowChat]               = useState(false);
  const [employees, setEmployees]             = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const st       = STATUS_MAP[property.status] || STATUS_MAP.pendiente;
  const stageIdx = STAGE_BY_STATUS[property.status] ?? 1;
  const STAGES   = [t('own.stageRegister'), t('own.stageValuation'), t('own.stageSigning'), t('own.stageSale')];

  const loadMessages = () => {
    fetch(`${API}/chat/${property.id}/`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setMessages(data.messages || []))
      .catch(() => {});
  };

  const toggleChat = () => {
    if (!showChat) {
      loadMessages();
      if (employees.length === 0) {
        fetch(`${API}/auth/employees/`, { headers: authHeaders() })
          .then(r => r.json())
          .then(data => setEmployees(data.results || data))
          .catch(() => {});
      }
    }
    setShowChat(s => !s);
  };

  const sendMsg = async () => {
    if (!msgInput.trim()) return;
    await fetch(`${API}/chat/${property.id}/`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ content: msgInput.trim() }),
    });
    setMsgInput('');
    loadMessages();
  };

  return (
    <div className={styles.propCard}>
      <div className={styles.propCardTop}>
        <div>
          <div className={styles.propCardName}>{property.title}</div>
          <div className={styles.propCardAddr}>{property.address}, {property.city}</div>
        </div>
        <span className={`${styles.pill} ${styles[st.cls]}`}>{t(st.key)}</span>
      </div>

      <div className={styles.propStats}>
        <div className={styles.propStat}>
          <div className={styles.propStatVal}>
            {property.type === 'alquiler'
              ? `${Number(property.price).toLocaleString('es-ES')} €/mes`
              : `${Number(property.price).toLocaleString('es-ES')} €`}
          </div>
          <div className={styles.propStatLabel}>{t('own.price')}</div>
        </div>
        <div className={styles.propStat}>
          <div className={styles.propStatVal}>{property.sqm} m²</div>
          <div className={styles.propStatLabel}>{t('own.surface')}</div>
        </div>
        <div className={styles.propStat}>
          <div className={styles.propStatVal}>{property.rooms}</div>
          <div className={styles.propStatLabel}>{t('own.rooms')}</div>
        </div>
        <div className={styles.propStat}>
          <div className={styles.propStatVal} style={{ textTransform: 'capitalize' }}>{property.type}</div>
          <div className={styles.propStatLabel}>{t('own.operation')}</div>
        </div>
      </div>

      {/* Barra de progreso funcional según estado */}
      <div className={styles.stagesWrap}>
        <div className={styles.stagesLabel}>
          {t('own.progress')} — {t('own.phase')} {stageIdx + 1} {t('own.of')} {STAGES.length}
        </div>
        <div className={styles.stages}>
          {STAGES.map((s, i) => (
            <div key={s} className={styles.stageItem}>
              <div className={`${styles.stageDot}
                ${i < stageIdx ? styles.stageDone : ''}
                ${i === stageIdx ? styles.stageCurrent : ''}`}>
                {i < stageIdx ? '✓' : i + 1}
              </div>
              <div className={`${styles.stageLabel}
                ${i < stageIdx ? styles.stageDoneLabel : ''}
                ${i === stageIdx ? styles.stageCurrentLabel : ''}`}>{s}</div>
              {i < STAGES.length - 1 && (
                <div className={`${styles.stageLine} ${i < stageIdx ? styles.stageLineDone : ''}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className={styles.msgBlock}>
        <button className={styles.msgBlockHead} onClick={toggleChat}>
          {t('chat.team')} {showChat ? '▴' : '▾'}
        </button>
        {showChat && (
          <>
            {employees.length > 0 && messages.length === 0 && (
              <div style={{ padding: '10px 24px' }}>
                <select className={styles.msgInput} value={selectedEmployee}
                  onChange={e => setSelectedEmployee(e.target.value)}>
                  <option value="">{t('own.selectAgent')}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={styles.msgList}>
              {messages.length === 0 && <div className={styles.noMessages}>{t('chat.noMessages')}</div>}
              {messages.map((m, i) => (
                <div key={i} className={`${styles.msgRow} ${m.sender_role !== 'employee' ? styles.msgRowOwn : ''}`}>
                  <div className={`${styles.msgAv} ${m.sender_role === 'employee' ? styles.msgAvEmp : styles.msgAvOwn}`}>
                    {(m.sender_name || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className={styles.msgContent}>
                    <div className={`${styles.msgBubble} ${m.sender_role !== 'employee' ? styles.msgBubbleOwn : ''}`}>
                      {m.content}
                    </div>
                    <div className={styles.msgMeta}>
                      {m.sender_name} · {new Date(m.sent_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.msgCompose}>
              <input className={styles.msgInput} placeholder={t('chat.placeholder')}
                value={msgInput} onChange={e => setMsgInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMsg()} />
              <button className={styles.btnPrimary} onClick={sendMsg}>{t('chat.send')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RegisterForm({ onSuccess }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    title: '', address: '', city: '', price: '', type: 'venta', category: 'piso',
    rooms: '', baths: '', sqm: '', garage: false, terrace: false, description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0, rooms: parseInt(form.rooms) || 1,
      baths: parseInt(form.baths) || 1, sqm: parseInt(form.sqm) || 0,
      status: 'pendiente',
    };
    try {
      const res = await fetch(`${API}/properties/mine/`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(Object.values(data).flat().join(' '));
      } else {
        setSuccess(true);
        setTimeout(onSuccess, 1800);
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}><h1 className={styles.pageTitle}>{t('own.register')}</h1></div>
      {success && <div className={styles.successBanner}>✓ {t('own.sent')}</div>}
      {error && <div className={styles.errorBanner}>⚠ {error}</div>}
      <div className={styles.infoBanner}>ℹ {t('own.infoMsg')}</div>
      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>{t('own.title')}</label>
            <input name="title" className={styles.formInput} value={form.title} onChange={handle} required />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('own.address')}</label>
            <input name="address" className={styles.formInput} value={form.address} onChange={handle} required />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('own.city')}</label>
            <input name="city" className={styles.formInput} value={form.city} onChange={handle} required />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('own.priceField')}</label>
            <input name="price" type="number" className={styles.formInput} value={form.price} onChange={handle} required />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('own.opType')}</label>
            <select name="type" className={styles.formInput} value={form.type} onChange={handle}>
              <option value="venta">{t('own.wantSell')}</option>
              <option value="alquiler">{t('own.wantRent')}</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('own.propType')}</label>
            <select name="category" className={styles.formInput} value={form.category} onChange={handle}>
              <option value="piso">{t('landing.flats')}</option>
              <option value="casa">{t('landing.houses')}</option>
              <option value="estudio">Estudio</option>
              <option value="local">Local</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('own.rooms')}</label>
            <input name="rooms" type="number" className={styles.formInput} value={form.rooms} onChange={handle} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('prop.baths')}</label>
            <input name="baths" type="number" className={styles.formInput} value={form.baths} onChange={handle} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('own.surface')} (m²)</label>
            <input name="sqm" type="number" className={styles.formInput} value={form.sqm} onChange={handle} />
          </div>
          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>{t('own.description')}</label>
            <textarea name="description" className={styles.formInput} rows={4} value={form.description} onChange={handle} />
          </div>
          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>{t('own.extras')}</label>
            <div className={styles.checkRow}>
              <label className={styles.checkLabel}>
                <input type="checkbox" name="garage" checked={form.garage} onChange={handle} /> {t('prop.garage')}
              </label>
              <label className={styles.checkLabel}>
                <input type="checkbox" name="terrace" checked={form.terrace} onChange={handle} /> {t('prop.terrace')}
              </label>
            </div>
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={loading || success}>
            {loading ? t('own.sending') : t('own.sendRequest')}
          </button>
        </div>
      </form>
    </div>
  );
}

function SettingsView() {
  const { logout } = useAuth();
  const { t }      = useI18n();
  const navigate   = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/delete-account/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
      });
      if (res.status === 204) { logout(); navigate('/'); }
    } catch {
      alert('Error al eliminar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}><h1 className={styles.pageTitle}>{t('own.settings')}</h1></div>
      <div className={styles.dangerZone}>
        <div className={styles.dangerTitle}>{t('own.dangerZone')}</div>
        <p className={styles.dangerText}>{t('own.deleteWarning')}</p>
        {!confirm ? (
          <button className={styles.dangerBtn} onClick={() => setConfirm(true)}>{t('own.deleteBtn')}</button>
        ) : (
          <div className={styles.dangerConfirm}>
            <span>{t('own.deleteSure')}</span>
            <button className={styles.btnGhost} onClick={() => setConfirm(false)}>{t('own.cancel')}</button>
            <button className={styles.dangerBtnSolid} onClick={handleDelete} disabled={loading}>
              {loading ? t('own.deleting') : t('own.confirmDelete')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceholderView({ label }) {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}><h1 className={styles.pageTitle}>{label}</h1></div>
      <div className={styles.placeholder}>Próximamente.</div>
    </div>
  );
}
