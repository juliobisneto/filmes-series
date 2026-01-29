import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Loading, ErrorMessage } from '../components/Loading';
import './SuggestionsPage.css';

function SuggestionsPage() {
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  const [receivedSuggestions, setReceivedSuggestions] = useState([]);
  const [sentSuggestions, setSentSuggestions] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'pending', 'accepted', 'rejected', 'all'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null); // ID da sugestão sendo processada

  useEffect(() => {
    loadSuggestions();
    window.scrollTo(0, 0);
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [receivedRes, sentRes] = await Promise.all([
        api.get('/suggestions/received'),
        api.get('/suggestions/sent')
      ]);

      setReceivedSuggestions(receivedRes.data.data);
      setSentSuggestions(sentRes.data.data);
    } catch (err) {
      console.error('Erro ao carregar sugestões:', err);
      setError('Erro ao carregar sugestões');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (suggestionId, title) => {
    if (!window.confirm(`Aceitar sugestão de "${title}"?\n\nO filme será adicionado à sua coleção com status "Quero Ver".`)) {
      return;
    }

    try {
      setProcessing(suggestionId);
      await api.put(`/suggestions/${suggestionId}/respond`, { action: 'accept' });
      
      // Recarregar sugestões
      await loadSuggestions();
      
      alert(`"${title}" foi adicionado à sua coleção!`);
    } catch (err) {
      console.error('Erro ao aceitar sugestão:', err);
      if (err.response?.status === 409) {
        alert('Este filme já está na sua coleção!');
      } else {
        alert('Erro ao aceitar sugestão. Tente novamente.');
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (suggestionId, title) => {
    if (!window.confirm(`Recusar sugestão de "${title}"?`)) {
      return;
    }

    try {
      setProcessing(suggestionId);
      await api.put(`/suggestions/${suggestionId}/respond`, { action: 'reject' });
      
      // Recarregar sugestões
      await loadSuggestions();
      
      alert('Sugestão recusada');
    } catch (err) {
      console.error('Erro ao recusar sugestão:', err);
      alert('Erro ao recusar sugestão. Tente novamente.');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (suggestionId, title) => {
    if (!window.confirm(`Cancelar sugestão de "${title}"?`)) {
      return;
    }

    try {
      setProcessing(suggestionId);
      await api.delete(`/suggestions/${suggestionId}`);
      
      // Recarregar sugestões
      await loadSuggestions();
      
      alert('Sugestão cancelada');
    } catch (err) {
      console.error('Erro ao cancelar sugestão:', err);
      alert('Erro ao cancelar sugestão. Tente novamente.');
    } finally {
      setProcessing(null);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star filled' : 'star empty'}>
          {i <= rating ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pendente', class: 'badge-pending' },
      accepted: { text: 'Aceita', class: 'badge-accepted' },
      rejected: { text: 'Recusada', class: 'badge-rejected' }
    };
    return badges[status] || badges.pending;
  };

  const getFilteredReceived = () => {
    if (filter === 'all') return receivedSuggestions;
    return receivedSuggestions.filter(s => s.status === filter);
  };

  const pendingCount = receivedSuggestions.filter(s => s.status === 'pending').length;

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="suggestions-page">
      <div className="suggestions-header">
        <h1>💡 Sugestões de Filmes</h1>
        <p>Veja as sugestões que você recebeu e enviou para seus amigos</p>
      </div>

      {/* Tabs */}
      <div className="suggestions-tabs">
        <button
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          📥 Recebidas
          {pendingCount > 0 && (
            <span className="tab-badge">{pendingCount}</span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          📤 Enviadas
        </button>
      </div>

      {/* Content */}
      {activeTab === 'received' ? (
        <div className="suggestions-content">
          {/* Filter */}
          <div className="suggestions-filter">
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pendentes ({receivedSuggestions.filter(s => s.status === 'pending').length})
            </button>
            <button
              className={`filter-btn ${filter === 'accepted' ? 'active' : ''}`}
              onClick={() => setFilter('accepted')}
            >
              Aceitas ({receivedSuggestions.filter(s => s.status === 'accepted').length})
            </button>
            <button
              className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              Recusadas ({receivedSuggestions.filter(s => s.status === 'rejected').length})
            </button>
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todas ({receivedSuggestions.length})
            </button>
          </div>

          {/* Cards */}
          {getFilteredReceived().length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3>Nenhuma sugestão {filter !== 'all' ? getStatusBadge(filter).text.toLowerCase() : 'recebida'}</h3>
              <p>Quando seus amigos sugerirem filmes, eles aparecerão aqui!</p>
            </div>
          ) : (
            <div className="suggestions-grid">
              {getFilteredReceived().map(suggestion => (
                <div key={suggestion.id} className="suggestion-card">
                  <div className="suggestion-poster">
                    {suggestion.poster_url ? (
                      <img src={suggestion.poster_url} alt={suggestion.title} />
                    ) : (
                      <div className="poster-placeholder">🎬</div>
                    )}
                  </div>

                  <div className="suggestion-content">
                    <div className="suggestion-header">
                      <h3>{suggestion.title}</h3>
                      {suggestion.year && <span className="suggestion-year">({suggestion.year})</span>}
                    </div>

                    <div className="suggestion-from">
                      <span className="from-label">Sugerido por:</span>
                      <strong>{suggestion.sender_name}</strong>
                    </div>

                    {suggestion.message && (
                      <div className="suggestion-message">
                        <span className="message-icon">💬</span>
                        <p>"{suggestion.message}"</p>
                      </div>
                    )}

                    {suggestion.sender_rating && (
                      <div className="suggestion-rating">
                        <span className="rating-label">Nota do amigo:</span>
                        <div className="rating-stars">
                          {renderStars(suggestion.sender_rating)}
                        </div>
                      </div>
                    )}

                    {suggestion.imdb_rating && suggestion.imdb_rating !== 'N/A' && (
                      <div className="suggestion-imdb">
                        <span>⭐ IMDB:</span> <strong>{suggestion.imdb_rating}</strong>
                      </div>
                    )}

                    <div className="suggestion-date">
                      Sugerido em {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
                    </div>

                    {suggestion.status === 'pending' ? (
                      <div className="suggestion-actions">
                        <button
                          className="btn-accept"
                          onClick={() => handleAccept(suggestion.id, suggestion.title)}
                          disabled={processing === suggestion.id}
                        >
                          ✓ Adicionar à Minha Coleção
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleReject(suggestion.id, suggestion.title)}
                          disabled={processing === suggestion.id}
                        >
                          ✗ Não, obrigado
                        </button>
                      </div>
                    ) : (
                      <div className={`suggestion-status ${getStatusBadge(suggestion.status).class}`}>
                        {getStatusBadge(suggestion.status).text}
                        {suggestion.responded_at && (
                          <span className="status-date">
                            {' '}em {new Date(suggestion.responded_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="suggestions-content">
          {sentSuggestions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📤</span>
              <h3>Você ainda não sugeriu filmes</h3>
              <p>Na sua coleção, clique em "Sugerir" para recomendar filmes aos seus amigos!</p>
            </div>
          ) : (
            <div className="suggestions-grid">
              {sentSuggestions.map(suggestion => (
                <div key={suggestion.id} className="suggestion-card sent">
                  <div className="suggestion-poster">
                    {suggestion.poster_url ? (
                      <img src={suggestion.poster_url} alt={suggestion.title} />
                    ) : (
                      <div className="poster-placeholder">🎬</div>
                    )}
                  </div>

                  <div className="suggestion-content">
                    <div className="suggestion-header">
                      <h3>{suggestion.title}</h3>
                      {suggestion.year && <span className="suggestion-year">({suggestion.year})</span>}
                    </div>

                    <div className="suggestion-to">
                      <span className="to-label">Sugerido para:</span>
                      <strong>{suggestion.receiver_name}</strong>
                    </div>

                    {suggestion.message && (
                      <div className="suggestion-message">
                        <span className="message-icon">💬</span>
                        <p>"{suggestion.message}"</p>
                      </div>
                    )}

                    <div className="suggestion-date">
                      Enviado em {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
                    </div>

                    <div className={`suggestion-status ${getStatusBadge(suggestion.status).class}`}>
                      {getStatusBadge(suggestion.status).text}
                      {suggestion.responded_at && (
                        <span className="status-date">
                          {' '}em {new Date(suggestion.responded_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {suggestion.status === 'pending' && (
                      <div className="suggestion-actions">
                        <button
                          className="btn-cancel"
                          onClick={() => handleCancel(suggestion.id, suggestion.title)}
                          disabled={processing === suggestion.id}
                        >
                          🗑️ Cancelar Sugestão
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SuggestionsPage;
