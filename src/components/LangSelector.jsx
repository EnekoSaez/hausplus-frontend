import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import styles from './LangSelector.module.css';

// Etiquetas de idioma con banderas correctas
const LANG_LABELS = {
  es: 'ES',
  eu: 'EU', 
  en: 'EN',
};

// Nombres completos para el tooltip / accesibilidad
const LANG_NAMES = {
  es: 'Español',
  eu: 'Euskera',
  en: 'English',
};

export default function LangSelector() {
  const { lang, changeLang } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrap}>
      <button className={styles.trigger} onClick={() => setOpen(o => !o)}
        title={LANG_NAMES[lang]}>
        {LANG_LABELS[lang]}
        <span className={styles.chevron}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />
          <div className={styles.dropdown}>
            {Object.entries(LANG_LABELS).map(([code, label]) => (
              <button key={code}
                className={`${styles.option} ${lang === code ? styles.active : ''}`}
                onClick={() => { changeLang(code); setOpen(false); }}
                title={LANG_NAMES[code]}>
                <span className={styles.optFlag}>{label}</span>
                <span className={styles.optName}>{LANG_NAMES[code]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
