import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useGoogleLogin } from '@react-oauth/google';
import styles from './LoginPage.module.css';
import { API_URL as API } from '../config';

export default function RegisterPage() {
  const { login, setUser } = useAuth();
  const { t }     = useI18n();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    password: '', password2: '', role: 'client',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(Object.values(data).flat().join(' ')); return; }
      localStorage.setItem('access',  data.access);
      localStorage.setItem('refresh', data.refresh);
      await login({ email: form.email, password: form.password });
      if (form.role === 'owner') navigate('/propietario');
      else navigate('/');
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const ROLES = [
    { id: 'client', icon: '🏠', label: t('register.client'), desc: t('register.clientDesc') },
    { id: 'owner',  icon: '🔑', label: t('register.owner'),  desc: t('register.ownerDesc')  },
  ];

  const googleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API}/auth/google/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.detail || 'Error al registrarse con Google.');
          return;
        }

        localStorage.setItem('access',  data.access);
        localStorage.setItem('refresh', data.refresh);

        const { jwtDecode } = await import('jwt-decode');
        const payload = jwtDecode(data.access);
        const user = {
          name:  payload.name || data.user?.first_name
                ? `${data.user.first_name} ${data.user.last_name}`.trim()
                : data.user?.email || payload.email,
          email: payload.email || data.user?.email,
          role:  payload.role  || data.user?.role || 'client',
        };

        setUser(user);

        if (user.role === 'owner') navigate('/propietario');
        else navigate('/');

      } catch {
        setError('Error de conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('No se pudo conectar con Google. Inténtalo de nuevo.'),
  });

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.logo}>Haus<em>plus</em></div>
          <p className={styles.subtitle}>{t('register.title')}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>{t('register.roleQ')}</label>
            <div className={styles.roleGrid}>
              {ROLES.map(r => (
                <button key={r.id} type="button"
                  className={`${styles.roleOpt} ${form.role === r.id ? styles.roleSelected : ''}`}
                  onClick={() => setForm(f => ({ ...f, role: r.id }))}>
                  <span className={styles.roleIcon}>{r.icon}</span>
                  <span className={styles.roleName}>{r.label}</span>
                  <span className={styles.roleDesc}>{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className={styles.field}>
              <label className={styles.label}>{t('register.firstName')}</label>
              <input name="first_name" className={styles.input}
                placeholder="Mikel" value={form.first_name} onChange={handle} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('register.lastName')}</label>
              <input name="last_name" className={styles.input}
                placeholder="Urrestarazu" value={form.last_name} onChange={handle} required />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('login.email')}</label>
            <input name="email" type="email" className={styles.input}
              placeholder="tu@email.com" value={form.email} onChange={handle} required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t('login.password')}</label>
            <input name="password" type="password" className={styles.input}
              placeholder="Mínimo 8 caracteres" value={form.password} onChange={handle} required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirmar contraseña</label>
            <input name="password2" type="password" className={styles.input}
              placeholder="Repite la contraseña" value={form.password2} onChange={handle} required />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? t('register.loading') : t('register.submit')}
          </button>

          <div className={styles.divider}><span>{t('login.or')}</span></div>

          <button type="button" className={styles.googleBtn} onClick={() => googleRegister()}>
            <GoogleIcon />
            {t('login.google')}
          </button>
        </form>

        <div className={styles.footer}>
          {t('register.hasAccount')}{' '}
          <Link to="/login" className={styles.footerLink}>{t('register.login')}</Link>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 13.075 17.64 11.27 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
