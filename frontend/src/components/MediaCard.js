import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MediaCard.css';

function MediaCard({ media, onDelete, readOnly = false, onAddToCollection }) {
  const navigate = useNavigate();
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('quero_ver');

  const handleCardClick = (e) => {
    // Não navegar se clicar nos botões ou no seletor
    if (e.target.closest('button') || e.target.closest('.status-selector')) {
      return;
    }
    // Em modo readonly, não navegar para detalhes (não tem acesso)
    if (!readOnly) {
      navigate(`/details/${media.id}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir "${media.title}"?`)) {
      onDelete(media.id);
    }
  };

  const handleEdit = () => {
    navigate(`/edit/${media.id}`);
  };

  const handleAddClick = () => {
    setShowStatusSelector(true);
  };

  const handleConfirmAdd = () => {
    if (onAddToCollection) {
      onAddToCollection(media, selectedStatus);
    }
    setShowStatusSelector(false);
    setSelectedStatus('quero_ver');
  };

  const handleCancelAdd = () => {
    setShowStatusSelector(false);
    setSelectedStatus('quero_ver');
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
      'rever': 'Quero Ver Novamente',
      'ja_vi': 'Já Vi'
    };
    return statusLabels[status] || status;
  };

  const getTypeLabel = (type) => {
    return type === 'movie' ? 'Filme' : 'Série';
  };

  return (
    <div 
      className={`media-card ${media.status === 'quero_ver' ? 'highlight-quero-ver' : ''} ${readOnly ? 'readonly' : ''}`}
      onClick={handleCardClick}
    >
      <div className="media-card-poster">
        {media.poster_url ? (
          <img src={media.poster_url} alt={media.title} />
        ) : (
          <span>🎬</span>
        )}
        {readOnly && <div className="readonly-overlay">👀</div>}
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
                <span className="rating-label">Nota do amigo</span>
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

        {!readOnly && (
          <div className="media-card-actions">
            <button className="btn-edit" onClick={handleEdit}>
              Editar
            </button>
            <button className="btn-delete" onClick={handleDelete}>
              Excluir
            </button>
          </div>
        )}

        {readOnly && !showStatusSelector && (
          <div className="media-card-actions readonly-actions">
            <button className="btn-add-to-collection" onClick={handleAddClick}>
              ➕ Adicionar à Minha Coleção
            </button>
          </div>
        )}

        {readOnly && showStatusSelector && (
          <div className="status-selector" onClick={(e) => e.stopPropagation()}>
            <label>Adicionar como:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="quero_ver">Quero Ver</option>
              <option value="assistindo">Assistindo</option>
              <option value="rever">Quero Ver Novamente</option>
              <option value="ja_vi">Já Vi</option>
            </select>
            <div className="status-selector-actions">
              <button className="btn-confirm" onClick={handleConfirmAdd}>
                ✓ Confirmar
              </button>
              <button className="btn-cancel" onClick={handleCancelAdd}>
                ✕ Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaCard;
