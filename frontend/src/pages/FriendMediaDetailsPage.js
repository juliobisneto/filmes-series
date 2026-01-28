import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Loading, ErrorMessage } from '../components/Loading';
import './FriendMediaDetailsPage.css';

function FriendMediaDetailsPage() {
  const { friendId, mediaId } = useParams();
  const navigate = useNavigate();
  const [friendData, setFriendData] = useState(null);
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addStatus, setAddStatus] = useState('quero_ver');
  const [adding, setAdding] = useState(false);

  const loadMediaDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/friends/${friendId}/media/${mediaId}`);
      setFriendData(response.data.data.friend);
      setMedia(response.data.data.media);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      if (err.response?.status === 403) {
        setError('Você não tem permissão para ver este filme');
      } else {
        setError('Erro ao carregar detalhes do filme');
      }
    } finally {
      setLoading(false);
    }
  }, [friendId, mediaId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadMediaDetails();
  }, [loadMediaDetails]);

  const handleAddToCollection = async () => {
    if (!media) return;

    setAdding(true);
    try {
      const mediaToAdd = {
        ...media,
        status: addStatus,
        notes: media.notes ? `${media.notes}\n\nAdicionado da coleção de ${friendData.name}.` : `Adicionado da coleção de ${friendData.name}.`,
        id: undefined,
        user_id: undefined,
        date_added: undefined,
        date_watched: addStatus === 'ja_vi' ? new Date().toISOString().split('T')[0] : undefined,
      };

      const response = await api.post('/media', mediaToAdd);
      alert(`"${media.title}" foi adicionado à sua coleção com sucesso!`);
      navigate(`/details/${response.data.data.id}`);
    } catch (err) {
      console.error('Erro ao adicionar filme:', err);
      if (err.response?.status === 409) {
        const existingMedia = err.response.data.data;
        if (window.confirm(`"${media.title}" já existe na sua coleção com o status "${existingMedia.status}". Deseja vê-lo?`)) {
          navigate(`/details/${existingMedia.id}`);
        }
      } else {
        alert('Erro ao adicionar filme à sua coleção.');
      }
    } finally {
      setAdding(false);
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

  const getStatusLabel = (status) => {
    const statusLabels = {
      'quero_ver': 'Quero Ver',
      'assistindo': 'Assistindo',
      'rever': 'Quero Ver Novamente',
      'ja_vi': 'Já Vi'
    };
    return statusLabels[status] || status;
  };

  const getTypeLabel = (type) => {
    return type === 'movie' ? 'Filme' : 'Série';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!media) return <ErrorMessage message="Filme não encontrado" />;

  return (
    <div className="friend-media-details-page">
      <div className="details-header">
        <button onClick={() => navigate(`/friend/${friendId}`)} className="btn-back">
          ← Voltar para Coleção de {friendData?.name}
        </button>
        <span className="readonly-badge">👀 Visualizando Filme de {friendData?.name}</span>
      </div>

      <div className="details-content">
        <div className="details-poster">
          {media.poster_url ? (
            <img src={media.poster_url} alt={media.title} />
          ) : (
            <div className="no-poster">
              <span>🎬</span>
              <p>Sem poster</p>
            </div>
          )}
        </div>

        <div className="details-info">
          <div className="details-title-section">
            <h1>{media.title}</h1>
            <div className="details-meta">
              <span className={`type-badge ${media.type}`}>{getTypeLabel(media.type)}</span>
              <span className={`status-badge ${media.status}`}>{getStatusLabel(media.status)}</span>
            </div>
          </div>

          <div className="details-sections">
            {/* Informações Básicas */}
            <div className="info-section">
              <h3>📋 Informações</h3>
              <div className="info-grid">
                {media.year && (
                  <div className="info-item">
                    <span className="info-label">📅 Ano</span>
                    <span className="info-value">{media.year}</span>
                  </div>
                )}
                {media.runtime && (
                  <div className="info-item">
                    <span className="info-label">⏱️ Duração</span>
                    <span className="info-value">{media.runtime}</span>
                  </div>
                )}
                {media.country && (
                  <div className="info-item">
                    <span className="info-label">🌍 País</span>
                    <span className="info-value">{media.country}</span>
                  </div>
                )}
                {media.genre && (
                  <div className="info-item">
                    <span className="info-label">🎭 Gênero</span>
                    <span className="info-value">{media.genre}</span>
                  </div>
                )}
                {media.date_watched && (
                  <div className="info-item">
                    <span className="info-label">📆 {friendData?.name} Assistiu</span>
                    <span className="info-value">{formatDate(media.date_watched)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Avaliações */}
            {(media.rating || (media.imdb_rating && media.imdb_rating !== 'N/A')) && (
              <div className="info-section">
                <h3>⭐ Avaliações</h3>
                <div className="ratings-container">
                  {media.rating && (
                    <div className="rating-box">
                      <span className="rating-label">Nota de {friendData?.name}</span>
                      <div className="rating-stars">
                        {renderStars(media.rating)}
                      </div>
                    </div>
                  )}
                  {media.imdb_rating && media.imdb_rating !== 'N/A' && (
                    <div className="rating-box">
                      <span className="rating-label">IMDB</span>
                      <div className="rating-value">
                        <span className="star-icon">⭐</span>
                        <span className="rating-number">{media.imdb_rating}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sinopse */}
            {media.plot && media.plot !== 'N/A' && (
              <div className="info-section">
                <h3>📖 Sinopse</h3>
                <p className="plot-text">{media.plot}</p>
              </div>
            )}

            {/* Equipe */}
            {(media.director || media.actors) && (
              <div className="info-section">
                <h3>🎬 Equipe</h3>
                {media.director && (
                  <div className="crew-item">
                    <span className="crew-label">🎥 Direção:</span>
                    <span className="crew-value">
                      {media.director.split(',').map((director, index) => (
                        <span key={index}>
                          <Link to={`/person/${director.trim()}`} className="crew-link">
                            {director.trim()}
                          </Link>
                          {index < media.director.split(',').length - 1 && ', '}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {media.actors && (
                  <div className="crew-item">
                    <span className="crew-label">🎭 Elenco:</span>
                    <span className="crew-value">
                      {media.actors.split(',').map((actor, index) => (
                        <span key={index}>
                          <Link to={`/person/${actor.trim()}`} className="crew-link">
                            {actor.trim()}
                          </Link>
                          {index < media.actors.split(',').length - 1 && ', '}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            {media.notes && (
              <div className="info-section">
                <h3>📝 Observações de {friendData?.name}</h3>
                <p className="notes-text">{media.notes}</p>
              </div>
            )}

            {/* Adicionar à Coleção */}
            <div className="info-section add-section">
              <h3>➕ Adicionar à Minha Coleção</h3>
              <div className="add-controls">
                <label htmlFor="add-status">Escolha o status:</label>
                <select 
                  id="add-status"
                  value={addStatus} 
                  onChange={(e) => setAddStatus(e.target.value)}
                  disabled={adding}
                >
                  <option value="quero_ver">Quero Ver</option>
                  <option value="assistindo">Assistindo</option>
                  <option value="rever">Quero Ver Novamente</option>
                  <option value="ja_vi">Já Vi</option>
                </select>
                <button 
                  className="btn-add-collection"
                  onClick={handleAddToCollection}
                  disabled={adding}
                >
                  {adding ? '⏳ Adicionando...' : '✓ Adicionar à Minha Coleção'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FriendMediaDetailsPage;
