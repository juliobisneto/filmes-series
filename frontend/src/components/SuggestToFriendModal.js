import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './SuggestToFriendModal.css';

function SuggestToFriendModal({ media, onClose }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(null); // ID do amigo sendo processado
  const [success, setSuccess] = useState(null); // ID do amigo com sucesso
  const modalRef = useRef(null);

  useEffect(() => {
    loadFriends();
    
    // Fechar com ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/friends');
      setFriends(response.data.data);
    } catch (err) {
      console.error('Erro ao carregar amigos:', err);
      setError('Erro ao carregar lista de amigos');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSuggestion = async (friendId) => {
    try {
      setSending(friendId);
      setError(null);

      await api.post('/suggestions/send', {
        receiverId: friendId,
        mediaId: media.id,
        message: message.trim() || null
      });

      setSuccess(friendId);
      
      // Limpar mensagem após envio
      setMessage('');
      
      // Fechar modal após 1.5s
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Erro ao enviar sugestão:', err);
      if (err.response?.status === 409) {
        setError('Você já sugeriu este filme para este amigo');
      } else if (err.response?.status === 403) {
        setError('Você precisa ser amigo para enviar sugestões');
      } else {
        setError(err.response?.data?.error || 'Erro ao enviar sugestão');
      }
    } finally {
      setSending(null);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="modal-overlay" ref={modalRef} onClick={handleOverlayClick}>
      <div className="suggest-modal">
        <div className="suggest-modal-header">
          <h2>💡 Sugerir "{media.title}" para um amigo</h2>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <div className="suggest-modal-body">
          {/* Mensagem opcional */}
          <div className="suggest-message-section">
            <label htmlFor="suggest-message">
              💬 Mensagem (opcional)
            </label>
            <textarea
              id="suggest-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Por que você está sugerindo este filme? Ex: 'Melhor filme de ficção científica! Você vai amar!'"
              maxLength={500}
              rows={3}
            />
            <span className="char-count">{message.length}/500</span>
          </div>

          {/* Lista de amigos */}
          <div className="suggest-friends-section">
            <h3>👥 Escolha um amigo:</h3>

            {loading && (
              <div className="loading-friends">
                <div className="spinner"></div>
                <p>Carregando amigos...</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                <span>⚠️</span> {error}
              </div>
            )}

            {!loading && friends.length === 0 && (
              <div className="empty-friends">
                <p>Você ainda não tem amigos para sugerir filmes.</p>
                <p>Adicione amigos na página de Amigos!</p>
              </div>
            )}

            {!loading && friends.length > 0 && (
              <div className="friends-list">
                {friends.map(friend => (
                  <div key={friend.friend_id} className="friend-item">
                    <div className="friend-item-info">
                      <div className="friend-avatar">
                        {getInitials(friend.name)}
                      </div>
                      <div className="friend-details">
                        <span className="friend-name">{friend.name}</span>
                        <span className="friend-email">{friend.email}</span>
                      </div>
                    </div>
                    
                    {success === friend.friend_id ? (
                      <button className="btn-suggest-sent" disabled>
                        ✓ Enviado!
                      </button>
                    ) : (
                      <button
                        className="btn-suggest"
                        onClick={() => handleSendSuggestion(friend.friend_id)}
                        disabled={sending !== null}
                      >
                        {sending === friend.friend_id ? (
                          <>
                            <div className="spinner-small"></div>
                            Enviando...
                          </>
                        ) : (
                          '📤 Sugerir'
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuggestToFriendModal;
