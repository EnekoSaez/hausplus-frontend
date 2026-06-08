import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import styles from './EmployeeDashboard.module.css';
import { API_URL as API } from '../../config';

const STATUS_MAP = {
  activo:    { key: 'emp.statusActive',  cls: 'sActive'  },
  pendiente: { key: 'emp.statusPending', cls: 'sPending' },
  borrador:  { key: 'emp.statusDraft',   cls: 'sReview'  },
  vendido:   { key: 'emp.statusSold',    cls: 'sSold'    },
};

function authHeaders() {
  const token = localStorage.getItem('access');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { t }    = useI18n();
  const [activeNav, setActiveNav] = useState('dashboard');

  const NAV_ITEMS = [
    { id: 'dashboard',  label: t('emp.dashboard'),  section: 'main' },
    { id: 'properties', label: t('emp.properties'), section: 'main' },
    { id: 'pending',    label: t('emp.pending'),    section: 'main', badge: '!' },
    { id: 'clients',    label: t('emp.clients'),    section: 'main' },
    { id: 'owners',     label: t('emp.owners'),     section: 'main' },
    { id: 'publish',    label: t('emp.publish'),    section: 'tools' },
    { id: 'messages',   label: t('emp.messages'),   section: 'tools' },
    { id: 'stats',      label: t('emp.stats'),      section: 'tools' },
    { id: 'settings',   label: t('emp.settings'),   section: 'tools' },
  ];

  const mainItems  = NAV_ITEMS.filter(n => n.section === 'main');
  const toolsItems = NAV_ITEMS.filter(n => n.section === 'tools');

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sbUser}>
          <div className={styles.sbAvatar}>
            {(user?.name || user?.email || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div className={styles.sbName}>{user?.name || user?.email}</div>
            <div className={styles.sbRole}>{t('emp.role')}</div>
          </div>
        </div>

        <div className={styles.sbSection}>
          <div className={styles.sbLabel}>{t('emp.dashboard')}</div>
          {mainItems.map(item => (
            <button key={item.id}
              className={`${styles.sbItem} ${activeNav === item.id ? styles.sbActive : ''}`}
              onClick={() => setActiveNav(item.id)}>
              <span className={styles.sbDot} />{item.label}
              {item.badge && <span className={styles.sbBadge}>{item.badge}</span>}
            </button>
          ))}
        </div>

        <div className={styles.sbSection}>
          <div className={styles.sbLabel}>{t('emp.settings')}</div>
          {toolsItems.map(item => (
            <button key={item.id}
              className={`${styles.sbItem} ${activeNav === item.id ? styles.sbActive : ''}`}
              onClick={() => setActiveNav(item.id)}>
              <span className={styles.sbDot} />{item.label}
            </button>
          ))}
        </div>
      </aside>

      <main className={styles.main}>
        {activeNav === 'dashboard'  && <DashboardView onPublish={() => setActiveNav('publish')} />}
        {activeNav === 'properties' && <PropertiesView />}
        {activeNav === 'pending'    && <PendingView />}
        {activeNav === 'publish'    && <PublishForm onSuccess={() => setActiveNav('properties')} />}
        {activeNav === 'messages'   && <EmployeeMessagesView />}
        {!['dashboard', 'properties', 'pending', 'publish', 'messages'].includes(activeNav) && (
          <PlaceholderView label={NAV_ITEMS.find(n => n.id === activeNav)?.label} />
        )}
      </main>
    </div>
  );
}

/* ── Dashboard overview ── */
function DashboardView({ onPublish }) {
  const { t } = useI18n();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/properties/manage/`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setProperties(data.results || data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = [
    { num: properties.filter(p => p.status === 'activo').length,    label: t('emp.activeProps') },
    { num: properties.filter(p => p.status === 'pendiente').length, label: t('emp.pendingReview') },
    { num: properties.length,                                        label: t('emp.totalProps') },
    { num: properties.filter(p => p.status === 'vendido').length,   label: t('emp.soldProps') },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('emp.dashboard')}</h1>
        <button className={styles.btnPrimary} onClick={onPublish}>{t('emp.newProp')}</button>
      </div>
      <div className={styles.statsGrid}>
        {stats.map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statNum}>{loading ? '—' : s.num}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className={styles.tableCard}>
        <div className={styles.tableHead}>
          <span className={styles.tableTitle}>{t('emp.recentProps')}</span>
        </div>
        {loading ? (
          <div className={styles.loadingRow}>{t('emp.loading')}</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('emp.colProperty')}</th><th>{t('emp.colPrice')}</th>
                <th>{t('emp.colType')}</th><th>{t('emp.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {properties.slice(0, 5).map(p => {
                const st = STATUS_MAP[p.status] || STATUS_MAP.pendiente;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.propName}>{p.title}</div>
                      <div className={styles.propSub}>{p.address}, {p.city}</div>
                    </td>
                    <td>{p.type === 'alquiler' ? `${Number(p.price).toLocaleString('es-ES')} €/mes` : `${Number(p.price).toLocaleString('es-ES')} €`}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.type}</td>
                    <td><span className={`${styles.pill} ${styles[st.cls]}`}>{t(st.key)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Properties list ── */
function PropertiesView() {
  const { t } = useI18n();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = (status = '') => {
    setLoading(true);
    const url = status ? `${API}/properties/manage/?status=${status}` : `${API}/properties/manage/`;
    fetch(url, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setProperties(data.results || data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = (s) => { setStatusFilter(s); load(s); };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta propiedad?')) return;
    await fetch(`${API}/properties/manage/${id}/`, { method: 'DELETE', headers: authHeaders() });
    load(statusFilter);
  };

  const handleStatusChange = async (id, newStatus) => {
    await fetch(`${API}/properties/manage/${id}/`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status: newStatus }),
    });
    load(statusFilter);
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('emp.properties')}</h1>
      </div>
      <div className={styles.filterRow}>
        {['', 'pendiente', 'activo', 'borrador', 'vendido'].map(s => (
          <button key={s}
            className={`${styles.filterChip} ${statusFilter === s ? styles.filterChipActive : ''}`}
            onClick={() => handleFilter(s)}>
            {s === '' ? t('emp.all') : t(STATUS_MAP[s]?.key)}
          </button>
        ))}
      </div>
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingRow}>{t('emp.loading')}</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('emp.colProperty')}</th><th>{t('emp.colPrice')}</th><th>{t('emp.colType')}</th>
                <th>{t('emp.colCity')}</th><th>{t('emp.colStatus')}</th><th>{t('emp.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {properties.map(p => {
                const st = STATUS_MAP[p.status] || STATUS_MAP.pendiente;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.propName}>{p.title}</div>
                      <div className={styles.propSub}>{p.sqm} m² · {p.rooms} hab.</div>
                    </td>
                    <td>{p.type === 'alquiler' ? `${Number(p.price).toLocaleString('es-ES')} €/mes` : `${Number(p.price).toLocaleString('es-ES')} €`}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.type}</td>
                    <td>{p.city}</td>
                    <td>
                      <select className={`${styles.pill} ${styles[st.cls]}`} value={p.status}
                        onChange={e => handleStatusChange(p.id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer' }}>
                        {Object.entries(STATUS_MAP).map(([val, info]) => (
                          <option key={val} value={val}>{t(info.key)}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.iconBtn} onClick={() => handleDelete(p.id)}
                          style={{ color: 'var(--red-txt)' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {properties.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-hint)' }}>
                  {t('emp.noFilter')}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Pending review ── */
function PendingView() {
  const { t } = useI18n();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [feedback, setFeedback]     = useState({});

  const load = () => {
    setLoading(true);
    fetch(`${API}/properties/manage/?status=pendiente`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setProperties(data.results || data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (id, newStatus) => {
    await fetch(`${API}/properties/manage/${id}/`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status: newStatus }),
    });
    setFeedback(f => ({ ...f, [id]: newStatus === 'activo' ? 'approved' : 'rejected' }));
    setTimeout(() => {
      setProperties(prev => prev.filter(p => p.id !== id));
      setFeedback(f => { const n = { ...f }; delete n[id]; return n; });
    }, 1500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('emp.pending')}</h1>
        <button className={styles.btnGhost} onClick={load}>{t('emp.update')}</button>
      </div>
      {loading && <div className={styles.loadingRow}>{t('emp.loading')}</div>}
      {!loading && properties.length === 0 && (
        <div className={styles.placeholder}>✓ {t('emp.noPending')}</div>
      )}
      {properties.map(p => {
        const fb = feedback[p.id];
        return (
          <div key={p.id} className={`${styles.pendingCard} ${fb ? styles[`pendingCard_${fb}`] : ''}`}>
            <div className={styles.pendingHeader}>
              <div>
                <div className={styles.pendingTitle}>{p.title}</div>
                <div className={styles.pendingMeta}>
                  {p.address}, {p.city} · {t('emp.sentBy')}: <strong>{p.owner_name}</strong>
                </div>
              </div>
              <span className={`${styles.pill} ${styles.sPending}`}>{t('emp.statusPending')}</span>
            </div>
            <div className={styles.pendingDetails}>
              <div className={styles.pendingDetail}>
                <span className={styles.pendingDetailLabel}>{t('emp.colPrice')}</span>
                <span className={styles.pendingDetailVal}>
                  {p.type === 'alquiler' ? `${Number(p.price).toLocaleString('es-ES')} €/mes` : `${Number(p.price).toLocaleString('es-ES')} €`}
                </span>
              </div>
              <div className={styles.pendingDetail}>
                <span className={styles.pendingDetailLabel}>{t('emp.colType')}</span>
                <span className={styles.pendingDetailVal} style={{ textTransform: 'capitalize' }}>{p.type}</span>
              </div>
              <div className={styles.pendingDetail}>
                <span className={styles.pendingDetailLabel}>{t('emp.category')}</span>
                <span className={styles.pendingDetailVal} style={{ textTransform: 'capitalize' }}>{p.category}</span>
              </div>
              <div className={styles.pendingDetail}>
                <span className={styles.pendingDetailLabel}>{t('emp.surface')}</span>
                <span className={styles.pendingDetailVal}>{p.sqm} m²</span>
              </div>
              <div className={styles.pendingDetail}>
                <span className={styles.pendingDetailLabel}>{t('emp.rooms')}</span>
                <span className={styles.pendingDetailVal}>{p.rooms}</span>
              </div>
              <div className={styles.pendingDetail}>
                <span className={styles.pendingDetailLabel}>{t('emp.baths')}</span>
                <span className={styles.pendingDetailVal}>{p.baths}</span>
              </div>
              <div className={styles.pendingDetail}>
                <span className={styles.pendingDetailLabel}>{t('emp.garage')}</span>
                <span className={styles.pendingDetailVal}>{p.garage ? '✓' : '—'}</span>
              </div>
              <div className={styles.pendingDetail}>
                <span className={styles.pendingDetailLabel}>{t('emp.terrace')}</span>
                <span className={styles.pendingDetailVal}>{p.terrace ? '✓' : '—'}</span>
              </div>
            </div>
            {p.description && (
              <div className={styles.pendingDesc}>
                <span className={styles.pendingDetailLabel}>{t('emp.description')}</span>
                <p>{p.description}</p>
              </div>
            )}
            {fb ? (
              <div className={`${styles.pendingFeedback} ${fb === 'approved' ? styles.feedbackOk : styles.feedbackNo}`}>
                {fb === 'approved' ? `✓ ${t('emp.approved')}` : `✕ ${t('emp.rejected')}`}
              </div>
            ) : (
              <div className={styles.pendingActions}>
                <button className={styles.btnReject} onClick={() => changeStatus(p.id, 'borrador')}>
                  {t('emp.reject')}
                </button>
                <button className={styles.btnApprove} onClick={() => changeStatus(p.id, 'activo')}>
                  {t('emp.approve')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Publish form (con campo owner) ── */
function PublishForm({ onSuccess }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    title: '', address: '', city: '', zip_code: '', price: '', type: 'venta', category: 'piso',
    rooms: '', baths: '', sqm: '', garage: false, terrace: false, elevator: false, pool: false,
    description: '', status: 'activo',
  });
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API}/auth/owners/`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setOwners(data.results || data))
      .catch(() => {});
  }, []);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const payload = {
      ...form,
      price: parseFloat(form.price), rooms: parseInt(form.rooms) || 1,
      baths: parseInt(form.baths) || 1, sqm: parseInt(form.sqm) || 0,
    };
    if (selectedOwner) payload.owner = selectedOwner;
    try {
      const res = await fetch(`${API}/properties/manage/`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(Object.values(data).flat().join(' '));
      } else {
        setSuccess(true);
        setTimeout(() => { setSuccess(false); onSuccess(); }, 1500);
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('emp.publish')}</h1>
      </div>
      {success && <div className={styles.successBanner}>✓ {t('emp.published')}</div>}
      {error   && <div className={styles.errorBanner}>⚠ {error}</div>}
      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>{t('emp.owner')}</label>
            <select className={styles.formInput} value={selectedOwner}
              onChange={e => setSelectedOwner(e.target.value)} required>
              <option value="">{t('emp.selectOwner')}</option>
              {owners.map(o => (
                <option key={o.id} value={o.id}>{o.full_name} ({o.email})</option>
              ))}
            </select>
            {owners.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--amber-txt)' }}>{t('emp.noOwners')}</span>
            )}
          </div>
          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>{t('emp.title')}</label>
            <input name="title" className={styles.formInput} value={form.title} onChange={handle} required />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('emp.address')}</label>
            <input name="address" className={styles.formInput} value={form.address} onChange={handle} required />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('emp.city')}</label>
            <input name="city" className={styles.formInput} value={form.city} onChange={handle} required />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('emp.zipCode')}</label>
            <input name="zip_code" className={styles.formInput} value={form.zip_code} onChange={handle} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('emp.price')}</label>
            <input name="price" type="number" className={styles.formInput} value={form.price} onChange={handle} required />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('emp.opType')}</label>
            <select name="type" className={styles.formInput} value={form.type} onChange={handle}>
              <option value="venta">{t('prop.sale')}</option>
              <option value="alquiler">{t('prop.rent')}</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('emp.category')}</label>
            <select name="category" className={styles.formInput} value={form.category} onChange={handle}>
              <option value="piso">{t('landing.flats')}</option>
              <option value="casa">{t('landing.houses')}</option>
              <option value="estudio">Estudio</option>
              <option value="local">Local</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('emp.initialStatus')}</label>
            <select name="status" className={styles.formInput} value={form.status} onChange={handle}>
              <option value="activo">{t('emp.statusInitialActive')}</option>
              <option value="borrador">{t('emp.statusInitialDraft')}</option>
              <option value="pendiente">{t('emp.statusInitialPending')}</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('emp.rooms')}</label>
            <input name="rooms" type="number" className={styles.formInput} value={form.rooms} onChange={handle} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('emp.baths')}</label>
            <input name="baths" type="number" className={styles.formInput} value={form.baths} onChange={handle} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{t('emp.surface')} (m²)</label>
            <input name="sqm" type="number" className={styles.formInput} value={form.sqm} onChange={handle} />
          </div>
          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>{t('emp.description')}</label>
            <textarea name="description" className={styles.formInput} rows={4} value={form.description} onChange={handle} />
          </div>
          <div className={styles.formField} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.formLabel}>{t('emp.extras')}</label>
            <div className={styles.checkRow}>
              {[['garage', t('emp.garage')], ['terrace', t('emp.terrace')], ['elevator', 'Ascensor'], ['pool', 'Piscina']].map(([name, label]) => (
                <label key={name} className={styles.checkLabel}>
                  <input type="checkbox" name={name} checked={form[name]} onChange={handle} />{label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? t('emp.publishing') : t('emp.publishBtn')}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Employee messages (ve todas las conversaciones) ── */
function EmployeeMessagesView() {
  const { t } = useI18n();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    fetch(`${API}/chat/`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setConversations(data.results || data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openConversation = (conv) => {
    setSelected(conv);
    fetch(`${API}/chat/${conv.property}/`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setMessages(data.messages || []));
  };

  const sendMsg = async () => {
    if (!input.trim() || !selected) return;
    await fetch(`${API}/chat/${selected.property}/`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ content: input.trim() }),
    });
    setInput('');
    openConversation(selected);
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}><h1 className={styles.pageTitle}>{t('emp.messages')}</h1></div>
      <div className={styles.chatLayout}>
        <div className={styles.convList}>
          {loading && <div className={styles.loadingRow}>{t('emp.loading')}</div>}
          {conversations.map(conv => (
            <button key={conv.id}
              className={`${styles.convItem} ${selected?.id === conv.id ? styles.convItemActive : ''}`}
              onClick={() => openConversation(conv)}>
              <div className={styles.convTitle}>{conv.property_title}</div>
              {conv.unread_count > 0 && <span className={styles.unreadBadge}>{conv.unread_count}</span>}
            </button>
          ))}
          {!loading && conversations.length === 0 && (
            <div className={styles.placeholder} style={{ padding: 24, margin: 12 }}>{t('emp.noConvs')}</div>
          )}
        </div>
        <div className={styles.msgPanel}>
          {!selected ? (
            <div className={styles.noConvSelected}>{t('emp.selectConv')}</div>
          ) : (
            <>
              <div className={styles.msgPanelHeader}>{selected.property_title}</div>
              <div className={styles.msgList}>
                {messages.map((m, i) => (
                  <div key={i} className={`${styles.msgRow} ${m.sender_role === 'employee' ? styles.msgRowOwn : ''}`}>
                    <div className={`${styles.msgAv} ${m.sender_role === 'employee' ? styles.msgAvEmp : styles.msgAvOwn}`}>
                      {(m.sender_name || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className={styles.msgContent}>
                      <div className={`${styles.msgBubble} ${m.sender_role === 'employee' ? styles.msgBubbleOwn : ''}`}>
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
                <input className={styles.msgInput} placeholder={t('emp.writeMsg')}
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMsg()} />
                <button className={styles.btnPrimary} onClick={sendMsg}>{t('chat.send')}</button>
              </div>
            </>
          )}
        </div>
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
