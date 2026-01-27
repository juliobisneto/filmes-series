import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mediaService } from '../services/api';
import { Loading, ErrorMessage } from '../components/Loading';
import './DetailsPage.css';

function DetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mediaService.getById(id);
      setMedia(response.data);
    } catch (err) {
      console.error('Erro ao carregar:', err);
      setError('Erro ao carregar detalhes.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir "${media.title}"?`)) {
      try {
        await mediaService.delete(id);
        navigate('/');
      } catch (err) {
        console.error('Erro ao excluir:', err);
        alert('Erro ao excluir filme/série.');
      }
    }
  };

  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<span key={i}>{i <= rating ? '★' : '☆'}</span>);
    }
    return stars;
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'quero_ver': 'Quero Ver',
      'assistindo': 'Assistindo',
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

  if (loading) {
    return (
      <div className="details-page container">
        <Loading />
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="details-page container">
        <ErrorMessage message={error || 'Filme/Série não encontrado.'} />
        <button className="btn-back" onClick={handleBack}>
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="details-page container">
      <div className="details-container">
        <div className="details-hero">
          <div className="details-poster">
            {media.poster_url ? (
              <img src={media.poster_url} alt={media.title} />
            ) : (
              <span>🎬</span>
            )}
          </div>

          <div className="details-main">
            <div className="details-header">
              <div className="details-title-section">
                <h1>{media.title}</h1>
                <div className="details-meta">
                  {media.year && <span>📅 {media.year}</span>}
                  {media.runtime && <span>⏱️ {media.runtime}</span>}
                  {media.genre && <span>🎭 {media.genre}</span>}
                </div>
              </div>
              <span className="type-badge">{getTypeLabel(media.type)}</span>
            </div>

            {(media.rating || (media.imdb_rating && media.imdb_rating !== 'N/A')) && (
              <div className="details-ratings">
                {media.rating && media.rating > 0 && (
                  <div className="rating-box">
                    <span className="rating-box-label">Minha Avaliação</span>
                    <div className="rating-box-value rating-stars">
                      {renderStars(media.rating)}
                    </div>
                  </div>
                )}
                {media.imdb_rating && media.imdb_rating !== 'N/A' && (
                  <div className="rating-box">
                    <span className="rating-box-label">IMDB</span>
                    <div className="rating-box-value">
                      ⭐ {media.imdb_rating}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <span className={`details-status ${media.status}`}>
                {getStatusLabel(media.status)}
              </span>
            </div>

            {media.imdb_id && (
              <div>
                <a
                  href={`https://www.imdb.com/title/${media.imdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="imdb-link"
                >
                  <span>🎬</span> Ver no IMDB
                </a>
              </div>
            )}
          </div>
        </div>

        {media.plot && (
          <div className="details-section">
            <h2>📖 Sinopse</h2>
            <p>{media.plot}</p>
          </div>
        )}

        <div className="details-section">
          <h2>ℹ️ Informações</h2>
          <div className="details-info-grid">
            {media.country && (
              <div className="info-item">
                <span className="info-label">País de Origem</span>
                <span className="info-value">{media.country}</span>
              </div>
            )}
            {media.director && (
              <div className="info-item">
                <span className="info-label">Diretor</span>
                <span className="info-value">{media.director}</span>
              </div>
            )}
            {media.actors && (
              <div className="info-item">
                <span className="info-label">Elenco</span>
                <span className="info-value">{media.actors}</span>
              </div>
            )}
            {media.date_watched && (
              <div className="info-item">
                <span className="info-label">Data que Assistiu</span>
                <span className="info-value">{formatDate(media.date_watched)}</span>
              </div>
            )}
          </div>
        </div>

        {media.notes && (
          <div className="details-section">
            <h2>📝 Minhas Anotações</h2>
            <p>{media.notes}</p>
          </div>
        )}

        <div className="details-actions">
          <button className="btn-back" onClick={handleBack}>
            ← Voltar
          </button>
          <button className="btn-edit-details" onClick={handleEdit}>
            Editar
          </button>
          <button className="btn-delete-details" onClick={handleDelete}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailsPage;
