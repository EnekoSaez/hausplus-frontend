import React, { useState, useRef, useEffect } from 'react';
import styles from './Chatbot.module.css';

const FAQ_RESPONSES = {
  gastos:   '💡 Los gastos de compra incluyen el ITP (6–10% según comunidad), notaría (~0,5%), registro (~0,2%) y gestoría. En total, calcula entre un 8% y 12% adicional al precio.',
  hipoteca: '🏦 Para solicitar una hipoteca necesitas nóminas de los últimos 3 meses, declaración de IRPF, vida laboral y DNI. Los bancos suelen financiar hasta el 80% del valor.',
  alquiler: '📋 Para alquilar necesitas DNI, nóminas o aval bancario, y en muchos casos un depósito de 1–2 meses. Nosotros gestionamos todo el proceso.',
  contacto: '📞 Puedes contactar con nuestros agentes en el 944 000 000 o por email en info@hausplus.es. Horario: L–V 9:00–18:00.',
};

function getBotReply(msg) {
  const m = msg.toLowerCase();
  if (m.includes('gasto') || m.includes('cost') || m.includes('impuesto')) return FAQ_RESPONSES.gastos;
  if (m.includes('hipoteca') || m.includes('banco') || m.includes('financ')) return FAQ_RESPONSES.hipoteca;
  if (m.includes('alquiler') || m.includes('arrendar') || m.includes('rentar')) return FAQ_RESPONSES.alquiler;
  if (m.includes('contacto') || m.includes('teléfono') || m.includes('agente')) return FAQ_RESPONSES.contacto;
  return '🤔 No tengo respuesta exacta para eso, pero nuestros agentes pueden ayudarte. ¿Quieres que te pongamos en contacto?';
}

const INITIAL = [{ from: 'bot', text: '¡Hola! Soy el asistente de Hausplus. ¿En qué puedo ayudarte hoy? Puedo orientarte sobre gastos de compra, hipotecas, alquileres y más.' }];

export default function Chatbot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState(INITIAL);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text }]);
    setTyping(true);
    await new Promise(r => setTimeout(r, 700));
    setTyping(false);
    setMessages(prev => [...prev, { from: 'bot', text: getBotReply(text) }]);
  };

  const handleKey = (e) => { if (e.key === 'Enter') send(); };

  return (
    <div className={styles.wrap}>
      {open && (
        <div className={styles.window}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.statusDot} />
              <div>
                <div className={styles.headerTitle}>Asistente Hausplus</div>
                <div className={styles.headerSub}>Responde al instante</div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.msg} ${m.from === 'bot' ? styles.msgBot : styles.msgUser}`}>
                {m.text}
              </div>
            ))}
            {typing && (
              <div className={`${styles.msg} ${styles.msgBot} ${styles.typing}`}>
                <span /><span /><span />
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className={styles.suggestions}>
            {['Gastos de compra', 'Hipotecas', 'Alquileres'].map(s => (
              <button key={s} className={styles.suggBtn} onClick={() => { setInput(s); }}>
                {s}
              </button>
            ))}
          </div>
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button className={styles.sendBtn} onClick={send}>→</button>
          </div>
        </div>
      )}
      <button className={styles.fab} onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
