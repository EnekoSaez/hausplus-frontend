import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PROPERTIES, formatPrice } from '../../assets/mockData';
import styles from './PropertyDetail.module.css';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const property = PROPERTIES.find(p => p.id === Number(id));

  if (!property) {
    return (
      <div className={styles.notFound}>
        <p>Propiedad no encontrada.</p>
        <button onClick={() => navigate('/')}>Volver al catálogo</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Volver</button>

        <div className={styles.layout}>
          {/* Left: image + features */}
          <div>
            <div className={styles.image} style={{ background: property.color }}>
              <span className={`${styles.badge} ${property.type === 'venta' ? styles.bSale : styles.bRent}`}>
                {property.type === 'venta' ? 'En venta' : 'En alquiler'}
              </span>
            </div>
            <div className={styles.featuresBox}>
              <h3 className={styles.featTitle}>Características</h3>
              <ul className={styles.featList}>
                {property.features.map(f => (
                  <li key={f} className={styles.featItem}>
                    <span className={styles.featDot} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: info + contact */}
          <div>
            <div className={styles.infoCard}>
              <div className={styles.price}>{formatPrice(property.price, property.type)}</div>
              <h1 className={styles.title}>{property.title}</h1>
              <p className={styles.address}>{property.address}, {property.city}</p>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{property.rooms}</span>
                  <span className={styles.metaLabel}>Habitaciones</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{property.baths}</span>
                  <span className={styles.metaLabel}>Baños</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{property.sqm} m²</span>
                  <span className={styles.metaLabel}>Superficie</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{property.garage ? 'Sí' : 'No'}</span>
                  <span className={styles.metaLabel}>Garaje</span>
                </div>
              </div>

              <div className={styles.divider} />

              <div className={styles.contactSection}>
                <p className={styles.contactLabel}>¿Te interesa esta propiedad?</p>
                <button className={styles.btnPrimary} onClick={() => navigate('/login')}>
                  Contactar con el agente
                </button>
                <button className={styles.btnGhost}>
                  Guardar en favoritos
                </button>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentAvatar}>AG</div>
              <div>
                <div className={styles.agentName}>Ana García</div>
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
