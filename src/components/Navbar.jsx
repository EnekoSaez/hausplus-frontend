import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import LangSelector from './LangSelector';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); setMenuOpen(false); navigate('/'); };
  const handleCatalog = () => { setMenuOpen(false); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>Haus<em>plus</em></Link>

        {user && user.role !== 'client' && (
          <div className={styles.sectionLabel}>
            {user.role === 'employee' ? 'Portal de empleados' : 'Mi espacio'}
          </div>
        )}

        <div className={styles.right}>
          {/* Selector de idioma — siempre visible */}
          <LangSelector />

          {!user ? (
            <>
              <button className={styles.btnGhost} onClick={() => navigate('/login')}>
                {t('nav.login')}
              </button>
              <button className={styles.btnPrimary} onClick={() => navigate('/registro')}>
                {t('nav.register')}
              </button>
            </>
          ) : (
            <div className={styles.userMenu}>
              <button className={styles.userBtn} onClick={() => setMenuOpen(!menuOpen)}>
                <div className={styles.avatar}>
                  {(user.name || user.email || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.chevron}>{menuOpen ? '▴' : '▾'}</span>
              </button>

              {menuOpen && (
                <>
                  <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
                  <div className={styles.dropdown}>
                    <div className={styles.dropEmail}>{user.email}</div>
                    <div className={styles.dropRole}>
                      {user.role === 'employee' ? '💼 Empleado' : user.role === 'owner' ? '🔑 Propietario' : '🏠 Cliente'}
                    </div>
                    <div className={styles.dropDivider} />
                    <button className={styles.dropItem} onClick={handleCatalog}>
                      🏘 {t('nav.catalog')}
                    </button>
                    <button className={styles.dropItem} onClick={() => { setMenuOpen(false); navigate('/mis-mensajes'); }}>
                      💬 {t('msg.navLink')}
                    </button>
                    {user.role === 'employee' && (
                      <button className={styles.dropItem} onClick={() => { setMenuOpen(false); navigate('/empleado'); }}>
                        📊 {t('nav.empPanel')}
                      </button>
                    )}
                    {user.role === 'owner' && (
                      <button className={styles.dropItem} onClick={() => { setMenuOpen(false); navigate('/propietario'); }}>
                        🏠 {t('nav.myPanel')}
                      </button>
                    )}
                    <div className={styles.dropDivider} />
                    <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
