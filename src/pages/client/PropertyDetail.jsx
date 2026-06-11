import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { API_URL as API } from '../../config';
import styles from './PropertyDetail.module.css';

const THUMB_COLORS = ['#b8cfe0', '#a3bc78', '#b89aaa', '#c2b280', '#8aad8a', '#a0b0c8'];

export default function PropertyDetail() {
  const { id }   = useParams();
  const { user } = useAuth();
  const { t }    = useI18n();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [contactMsg, setContactMsg]   = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [showContact, setShowContact] = useState(false);

  // Cargar la propiedad desde el backend
  useEffect(() => {
    fetch(`${API}/properties/${id}/`)
      .then(r => r.json())
      .then(data => { setProperty(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleContact = () => {
    if (!user) { navigate('/login'); return; }
    setShowContact(true);
  };

  const sendContact = async () => {
    if (!contactMsg.trim() || !property) return;
    try {
      await fetch(`${API}/chat/${property.id}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: contactMsg.trim() }),
      });
      setContactSent(true);
      setContactMsg('');
    } catch {
      alert('No se pudo enviar el mensaje. Inténtalo de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}><p style={{ padding: 40, textAlign: 'center', color: 'var(--text-hint)' }}>Cargando...</p></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <p style={{ padding: 40, textAlign: 'center', color: 'var(--text-hint)' }}>Propiedad no encontrada.</p>
          <button className={styles.back} onClick={() => navigate('/')}>← Volver al catálogo</button>
        </div>
      </div>
    );
  }

  const price = property.type === 'alquiler'
    ? `${Number(property.price).toLocaleString('es-ES')} € / mes`
    : `${Number(property.price).toLocaleString('es-ES')} €`;

  const thumbColor = THUMB_COLORS[property.id % THUMB_COLORS.length];

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button className={styles.back} onClick={() => navigate(-1)}>{t('prop.back')}</button>

        <div className={styles.layout}>
          {/* Left: image + features */}
          <div>
            <div className={styles.image}
              style={{ background: property.cover_image ? 'none' : thumbColor }}>
              {property.cover_image && (
                <img src={property.cover_image} alt={property.title}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <span className={`${styles.badge} ${property.type === 'venta' ? styles.bSale : styles.bRent}`}>
                {property.type === 'venta' ? t('prop.sale') : t('prop.rent')}
              </span>
            </div>

            <div className={styles.featuresBox}>
              <h3 className={styles.featTitle}>{t('prop.features')}</h3>
              <ul className={styles.featList}>
                {/* Construye la lista de características desde los campos booleanos */}
                {buildFeatures(property, t).map(f => (
                  <li key={f} className={styles.featItem}>
                    <span className={styles.featDot} />{f}
                  </li>
                ))}
              </ul>
              {property.description && (
                <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {property.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: info + contact */}
          <div>
            <div className={styles.infoCard}>
              <div className={styles.price}>{price}</div>
              <h1 className={styles.title}>{property.title}</h1>
              <p className={styles.address}>{property.address}, {property.city}</p>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{property.rooms}</span>
                  <span className={styles.metaLabel}>{t('prop.rooms')}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{property.baths}</span>
                  <span className={styles.metaLabel}>{t('prop.baths')}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{property.sqm} m²</span>
                  <span className={styles.metaLabel}>{t('prop.sqm')}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{property.garage ? '✓' : '—'}</span>
                  <span className={styles.metaLabel}>{t('prop.garage')}</span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.contactSection}>
                <p className={styles.contactLabel}>{t('prop.contactLabel')}</p>
                {!showContact ? (
                  <button className={styles.btnPrimary} onClick={handleContact}>
                    {t('prop.contact')}
                  </button>
                ) : contactSent ? (
                  <div style={{
                    background: 'var(--green-bg)', color: 'var(--green-txt)',
                    padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 13, textAlign: 'center'
                  }}>
                    {t('prop.contactSent')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <textarea
                      placeholder={t('prop.contactPlaceholder')}
                      value={contactMsg}
                      onChange={e => setContactMsg(e.target.value)}
                      rows={3}
                      style={{
                        padding: '10px 14px', border: '1px solid var(--border-mid)',
                        borderRadius: 'var(--r-md)', fontSize: 14, fontFamily: 'Outfit, sans-serif',
                        resize: 'vertical', outline: 'none'
                      }}
                    />
                    <button className={styles.btnPrimary} onClick={sendContact}>{t('prop.contactSendMsg')}</button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentAvatar}>
                {property.agent_name
                  ? property.agent_name.split(' ').map(n => n[0]).slice(0, 2).join('')
                  : 'AG'}
              </div>
              <div>
                <div className={styles.agentName}>{property.agent_name || 'Equipo Hausplus'}</div>
                <div className={styles.agentRole}>Agente responsable</div>
              </div>
              <div className={styles.agentPhone}>944 000 000</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Construye la lista de características a partir de los campos del backend
function buildFeatures(property, t) {
  const feats = [];
  if (property.garage)   feats.push(t('prop.garage'));
  if (property.terrace)  feats.push(t('prop.terrace'));
  if (property.elevator) feats.push('Ascensor');
  if (property.pool)     feats.push('Piscina');
  feats.push(`${property.sqm} m²`);
  feats.push(`${property.rooms} ${t('prop.rooms').toLowerCase()}`);
  return feats;
}
