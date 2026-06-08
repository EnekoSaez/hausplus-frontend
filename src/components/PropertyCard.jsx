import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import styles from './PropertyCard.module.css';

// Colores de fondo para las tarjetas cuando no hay imagen
const THUMB_COLORS = ['#b8cfe0', '#a3bc78', '#b89aaa', '#c2b280', '#8aad8a', '#a0b0c8'];

export default function PropertyCard({ property }) {
  const navigate = useNavigate();
  const { t }    = useI18n();

  const thumbColor = THUMB_COLORS[property.id % THUMB_COLORS.length];
  const price = property.type === 'alquiler'
    ? `${Number(property.price).toLocaleString('es-ES')} € / mes`
    : `${Number(property.price).toLocaleString('es-ES')} €`;

  return (
    <div className={styles.card} onClick={() => navigate(`/propiedad/${property.id}`)}>
      <div className={styles.thumb}
        style={{ background: property.cover_image ? 'none' : thumbColor }}>
        {property.cover_image && (
          <img src={property.cover_image} alt={property.title} className={styles.thumbImg} />
        )}
        <span className={`${styles.badge} ${property.type === 'venta' ? styles.badgeSale : styles.badgeRent}`}>
          {property.type === 'venta' ? t('prop.sale') : t('prop.rent')}
        </span>
        {property.garage && <span className={styles.featurePill}>{t('prop.garage')}</span>}
      </div>
      <div className={styles.body}>
        <div className={styles.price}>{price}</div>
        <div className={styles.title}>{property.title}</div>
        <div className={styles.address}>{property.address}, {property.city}</div>
        <div className={styles.meta}>
          <span className={styles.metaItem}>🛏 {property.rooms} {t('prop.rooms').toLowerCase()}</span>
          <span className={styles.metaItem}>🚿 {property.baths} {t('prop.baths').toLowerCase()}</span>
          <span className={styles.metaItem}>📐 {property.sqm} m²</span>
        </div>
      </div>
    </div>
  );
}
