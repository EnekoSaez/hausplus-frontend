import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import PropertyCard from '../../components/PropertyCard';
import Chatbot from '../../components/Chatbot';
import styles from './LandingPage.module.css';
import { API_URL as API } from '../../config';

export default function LandingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [properties,    setProperties]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeFilter,  setActiveFilter]  = useState('all');
  const [search,        setSearch]        = useState('');

  // Carga propiedades activas desde el backend real
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (activeFilter === 'venta' || activeFilter === 'alquiler') params.set('tipo', activeFilter);
    if (activeFilter === 'piso'  || activeFilter === 'casa')     params.set('categoria', activeFilter);

    fetch(`${API}/properties/?${params.toString()}`)
      .then(r => r.json())
      .then(data => { setProperties(data.results || data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeFilter, search]);

  const FILTERS = [
    { id: 'all',      label: t('landing.all') },
    { id: 'venta',    label: t('landing.buy') },
    { id: 'alquiler', label: t('landing.rent') },
    { id: 'piso',     label: t('landing.flats') },
    { id: 'casa',     label: t('landing.houses') },
  ];

  const count = properties.length;
  const countLabel = count === 1
    ? `1 ${t('landing.properties')}`
    : `${count} ${t('landing.propertiesPlural')}`;

  const { user, setUser } = useAuth();
  const handleUpgrade = async () => {
    const res = await fetch('http://127.0.0.1:8000/api/auth/upgrade-to-owner/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
    });
    const data = await res.json();
    localStorage.setItem('access',  data.access);
    localStorage.setItem('refresh', data.refresh);
    setUser({ ...user, role: 'owner' });
    navigate('/propietario');
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>{t('landing.eyebrow')}</p>
          <h1 className={styles.heroTitle}>
            {t('landing.title').split('\n').map((line, i) =>
              i === 1 ? <><br /><em key={i}>{line}</em></> : line
            )}
          </h1>
          <p className={styles.heroSub}>{t('landing.subtitle')}</p>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input className={styles.searchInput}
              placeholder={t('landing.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className={styles.searchBtn}>{t('landing.search')}</button>
          </div>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.stat}><span className={styles.statNum}>200+</span><span className={styles.statLabel}>{t('landing.statProps')}</span></div>
          <div className={styles.statDiv} />
          <div className={styles.stat}><span className={styles.statNum}>50+</span><span className={styles.statLabel}>{t('landing.statSold')}</span></div>
          <div className={styles.statDiv} />
          <div className={styles.stat}><span className={styles.statNum}>15</span><span className={styles.statLabel}>{t('landing.statAgents')}</span></div>
        </div>
      </section>

      {/* Banner upgrade a propietario — solo visible para clientes autenticados */}
      {user && user.role === 'client' && (
        <div className={styles.upgradeBanner}>
          ¿Quieres vender o alquilar tu propiedad?{' '}
          <button onClick={handleUpgrade}>Convertirme en propietario</button>
        </div>
      )}
      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterInner}>
          {FILTERS.map(f => (
            <button key={f.id}
              className={`${styles.chip} ${activeFilter === f.id ? styles.chipActive : ''}`}
              onClick={() => setActiveFilter(f.id)}>
              {f.label}
            </button>
          ))}
          <div className={styles.filterCount}>{countLabel}</div>
        </div>
      </div>

      {/* Grid */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.loadingMsg}>Cargando propiedades...</div>
        ) : properties.length > 0 ? (
          <div className={styles.grid}>
            {properties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>No hay propiedades disponibles con estos filtros.</p>
            <button className={styles.resetBtn}
              onClick={() => { setActiveFilter('all'); setSearch(''); }}>
              Ver todas
            </button>
          </div>
        )}
      </main>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>{t('landing.ctaTitle')}</h2>
          <p className={styles.ctaSub}>{t('landing.ctaSub')}</p>
          <button className={styles.ctaBtn} onClick={() => navigate('/login')}>
            {t('landing.ctaBtn')}
          </button>
        </div>
      </section>

      <Chatbot />
    </div>
  );
} 
