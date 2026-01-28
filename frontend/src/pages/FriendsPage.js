import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './FriendsPage.css';

function FriendsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadFriends = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/friends');
      setFriends(response.data.data);
    } catch (err) {
      console.error('Erro ao carregar amigos:', err);
      setError('Erro ao carregar lista de amigos');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/friends/requests');
      setRequests(response.data.data);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
      setError('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'requests') {
      loadRequests();
    }
  }, [activeTab, loadFriends, loadRequests]);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/friends/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.data);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.response?.data?.error || 'Erro ao buscar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (friendId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/friends/request', { friendId });
      setSuccessMessage(response.data.message);
      setTimeout(() => setSuccessMessage(null), 3000);
      // Atualizar resultados de busca
      handleSearch();
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err);
      setError(err.response?.data?.error || 'Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/friends/respond', { requestId, action });
      setSuccessMessage(response.data.message);
      setTimeout(() => setSuccessMessage(null), 3000);
      // Recarregar solicitações
      await loadRequests();
      // Se aceitou, recarregar amigos também
      if (action === 'accept') {
        await loadFriends();
      }
    } catch (err) {
      console.error('Erro ao responder solicitação:', err);
      setError(err.response?.data?.error || 'Erro ao responder solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (!window.confirm(`Tem certeza que deseja remover ${friendName} da sua lista de amigos?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.delete(`/friends/${friendId}`);
      setSuccessMessage('Amigo removido com sucesso');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadFriends();
    } catch (err) {
      console.error('Erro ao remover amigo:', err);
      setError(err.response?.data?.error || 'Erro ao remover amigo');
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatusBadge = (status) => {
    switch (status) {
      case 'friends':
        return <span className="status-badge friends">✓ Amigos</span>;
      case 'pending_sent':
        return <span className="status-badge pending">⏳ Solicitação enviada</span>;
      case 'pending_received':
        return <span className="status-badge pending">📬 Solicitação recebida</span>;
      default:
        return null;
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h1>👥 Meus Amigos</h1>
        <p className="friends-subtitle">Conecte-se com amigos e compartilhe suas experiências cinematográficas</p>
      </div>

      {error && (
        <div className="message error-message">
          ❌ {error}
        </div>
      )}

      {successMessage && (
        <div className="message success-message">
          ✅ {successMessage}
        </div>
      )}

      <div className="friends-tabs">
        <button
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Buscar Amigos
        </button>
        <button
          className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          👥 Meus Amigos {friends.length > 0 && `(${friends.length})`}
        </button>
        <button
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📬 Solicitações {(requests.received.length + requests.sent.length) > 0 && `(${requests.received.length + requests.sent.length})`}
        </button>
      </div>

      <div className="friends-content">
        {activeTab === 'search' && (
          <div className="search-section">
            <h2>🔍 Buscar Novos Amigos</h2>
            <p className="section-description">Digite o email ou nome de um amigo para encontrá-lo</p>
            
            <div className="search-box">
              <input
                type="text"
                placeholder="Digite email ou nome do amigo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {loading && <p className="loading-text">⏳ Buscando...</p>}

            {searchResults.length > 0 && (
              <div className="search-results">
                <h3>Resultados da Busca</h3>
                {searchResults.map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <h4>{user.name}</h4>
                        <p className="user-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="user-actions">
                      {getConnectionStatusBadge(user.connectionStatus)}
                      {user.connectionStatus === 'none' && (
                        <button
                          className="btn-add-friend"
                          onClick={() => handleSendRequest(user.id)}
                          disabled={loading}
                        >
                          ➕ Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
              <p className="no-results">Nenhum usuário encontrado</p>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="friends-list-section">
            <h2>👥 Meus Amigos</h2>
            
            {loading && <p className="loading-text">⏳ Carregando...</p>}

            {!loading && friends.length === 0 && (
              <div className="empty-state">
                <p className="empty-icon">😔</p>
                <p className="empty-text">Você ainda não tem amigos conectados</p>
                <button
                  className="btn-primary"
                  onClick={() => setActiveTab('search')}
                >
                  🔍 Buscar Amigos
                </button>
              </div>
            )}

            {friends.length > 0 && (
              <div className="friends-grid">
                {friends.map(friend => (
                  <div key={friend.friend_id} className="friend-card">
                    <div className="friend-header">
                      <div className="friend-avatar">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="friend-info">
                        <h3 
                          className="friend-name-link" 
                          onClick={() => navigate(`/friend/${friend.friend_id}`)}
                        >
                          {friend.name}
                        </h3>
                        <p className="friend-email">{friend.email}</p>
                        <p className="friend-since">Amigos desde {new Date(friend.friends_since).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="friend-actions">
                      <button
                        className="btn-view-collection"
                        onClick={() => navigate(`/friend/${friend.friend_id}`)}
                      >
                        📚 Ver Coleção
                      </button>
                      <button
                        className="btn-remove"
                        onClick={() => handleRemoveFriend(friend.friend_id, friend.name)}
                        disabled={loading}
                      >
                        🗑️ Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-section">
            <h2>📬 Solicitações de Amizade</h2>

            {loading && <p className="loading-text">⏳ Carregando...</p>}

            {!loading && requests.received.length === 0 && requests.sent.length === 0 && (
              <div className="empty-state">
                <p className="empty-icon">📭</p>
                <p className="empty-text">Nenhuma solicitação pendente</p>
              </div>
            )}

            {requests.received.length > 0 && (
              <div className="requests-subsection">
                <h3>📥 Recebidas ({requests.received.length})</h3>
                <div className="requests-list">
                  {requests.received.map(req => (
                    <div key={req.id} className="request-card">
                      <div className="request-info">
                        <div className="request-avatar">
                          {req.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="request-details">
                          <h4>{req.name}</h4>
                          <p className="request-email">{req.email}</p>
                          <p className="request-date">Enviada em {new Date(req.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="request-actions">
                        <button
                          className="btn-accept"
                          onClick={() => handleRespondRequest(req.id, 'accept')}
                          disabled={loading}
                        >
                          ✅ Aceitar
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRespondRequest(req.id, 'reject')}
                          disabled={loading}
                        >
                          ❌ Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {requests.sent.length > 0 && (
              <div className="requests-subsection">
                <h3>📤 Enviadas ({requests.sent.length})</h3>
                <div className="requests-list">
                  {requests.sent.map(req => (
                    <div key={req.id} className="request-card sent">
                      <div className="request-info">
                        <div className="request-avatar">
                          {req.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="request-details">
                          <h4>{req.name}</h4>
                          <p className="request-email">{req.email}</p>
                          <p className="request-date">Enviada em {new Date(req.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="request-status">
                        <span className="status-badge pending">⏳ Aguardando resposta</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendsPage;
