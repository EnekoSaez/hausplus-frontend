import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';
import { API_URL as API } from '../../config';
import styles from '../employee/EmployeeDashboard.module.css';

function authHeaders() {
  const token = localStorage.getItem('access');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function MyMessages() {
  const { t } = useI18n();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

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
    <div className={styles.page} style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('msg.myMessages')}</h1>
      </div>
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
            <div className={styles.placeholder} style={{ padding: 24, margin: 12 }}>
              {t('msg.noMessages')}
            </div>
          )}
        </div>
        <div className={styles.msgPanel}>
          {!selected ? (
            <div className={styles.noConvSelected}>{t('msg.selectConv')}</div>
          ) : (
            <>
              <div className={styles.msgPanelHeader}>{selected.property_title}</div>
              <div className={styles.msgList}>
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