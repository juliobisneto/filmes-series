import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MediaCard.css';

function MediaCard({ media, onDelete }) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Não navegar se clicar nos botões
    if (e.target.closest('button')) {
      return;
    }
    navigate(`/details/${media.id}`);
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir "${media.title}"?`)) {
      onDelete(media.id);
    }
  };

  const handleEdit = () => {
    navigate(`/edit/${media.id}`);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i}>{i <= rating ? '★' : '☆'}</span>
      );
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

  return (
    <div 
      className={`media-card ${media.status === 'quero_ver' ? 'highlight-quero-ver' : ''}`}
      onClick={handleCardClick}
    >
      <div className="media-card-poster">
        {media.poster_url ? (
          <img src={media.poster_url} alt={media.title} />
        ) : (
          <span>🎬</span>
        )}
      </div>
      
      <div className="media-card-content">
        <div className="media-card-header">
          <h3 className="media-card-title">{media.title}</h3>
          <span className="media-card-type">{getTypeLabel(media.type)}</span>
        </div>

        <div className="media-card-info">
          {media.year && (
            <div className="media-card-info-row">
              <span>📅</span> {media.year}
            </div>
          )}
          {media.runtime && (
            <div className="media-card-info-row">
              <span>⏱️</span> {media.runtime}
            </div>
          )}
          {media.genre && (
            <div className="media-card-genre">
              {media.genre}
            </div>
          )}
        </div>

        {(media.rating || media.imdb_rating) && (
          <div className="media-card-ratings">
            {media.rating && (
              <div className="rating-item">
                <span className="rating-label">Minha nota</span>
                <div className="rating-value rating-stars">
                  {renderStars(media.rating)}
                </div>
              </div>
            )}
            {media.imdb_rating && media.imdb_rating !== 'N/A' && (
              <div className="rating-item">
                <span className="rating-label">IMDB</span>
                <div className="rating-value">
                  <span>⭐</span> {media.imdb_rating}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="media-card-status">
          <span className={`status-badge ${media.status}`}>
            {getStatusLabel(media.status)}
          </span>
        </div>

        <div className="media-card-actions">
          <button className="btn-edit" onClick={handleEdit}>
            Editar
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default MediaCard;
