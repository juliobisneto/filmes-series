import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import SuggestToFriendModal from './SuggestToFriendModal';
import './MediaCard.css';

function MediaCard({ media, onDelete, readOnly = false, alreadyInCollection = false, showSuggestButton = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [addStatus, setAddStatus] = useState('quero_ver');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [isInCollection, setIsInCollection] = useState(alreadyInCollection); // Controlar estado local
  
  // Extrair friendId da URL se estivermos na página do amigo
  const friendId = location.pathname.match(/\/friend\/(\d+)/)?.[1];

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('.add-to-collection-options')) {
      return;
    }
    if (!readOnly) {
      navigate(`/details/${media.id}`);
    }
  };

  const handlePosterClick = (e) => {
    e.stopPropagation();
    if (readOnly && friendId) {
      // Navegar para a página de detalhes do filme do amigo
      navigate(`/friend/${friendId}/media/${media.id}`);
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
    setShowAddOptions(true);
    setAddError(null);
    setAddSuccess(null);
  };

  const handleConfirmAdd = async () => {
    setAdding(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      const mediaToAdd = {
        ...media,
        status: addStatus,
        notes: media.notes ? `${media.notes}\nAdicionado da coleção de um amigo.` : `Adicionado da coleção de um amigo.`,
        id: undefined, // Ensure new ID is generated
        user_id: undefined, // Ensure new user_id is set by backend
        date_added: undefined, // Let backend set current timestamp
        date_watched: addStatus === 'ja_vi' ? new Date().toISOString().split('T')[0] : undefined,
      };

      await api.post('/media', mediaToAdd);
      setAddSuccess('Filme adicionado com sucesso!');
      
      // Marcar como adicionado à coleção
      setIsInCollection(true);
      
      // Fechar o modal após 1.5 segundos
      setTimeout(() => {
        setShowAddOptions(false);
        setAddSuccess(null);
      }, 1500);
    } catch (err) {
      console.error('Erro ao adicionar filme:', err);
      console.error('Erro response:', err.response);
      
      if (err.response?.status === 409) {
        const existingMedia = err.response?.data?.data;
        
        if (existingMedia && existingMedia.id) {
          const statusLabels = {
            'quero_ver': 'Quero Ver',
            'assistindo': 'Assistindo',
            'rever': 'Quero Ver Novamente',
            'ja_vi': 'Já Vi'
          };
          const statusText = statusLabels[existingMedia.status] || existingMedia.status || 'status desconhecido';
          
          setAddError(`"${media.title}" já existe na sua coleção com o status "${statusText}".`);
        } else {
          setAddError('Filme já existe na sua coleção.');
        }
      } else {
        setAddError('Erro ao adicionar filme à sua coleção.');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddOptions(false);
    setAddError(null);
    setAddSuccess(null);
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
    <>
      <div 
        className={`media-card ${media.status === 'quero_ver' ? 'highlight-quero-ver' : ''} ${readOnly ? 'readonly' : ''} ${showSuggestModal ? 'modal-open' : ''}`}
        onClick={showSuggestModal ? undefined : handleCardClick}
        style={showSuggestModal ? { pointerEvents: 'none' } : {}}
      >
      <div 
        className={`media-card-poster ${readOnly ? 'clickable-poster' : ''}`}
        onClick={handlePosterClick}
      >
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
                <span className="rating-label">{readOnly ? 'Nota do amigo' : 'Minha nota'}</span>
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
          {!readOnly ? (
            <>
              <button className="btn-edit" onClick={handleEdit}>
                Editar
              </button>
              <button className="btn-delete" onClick={handleDelete}>
                Excluir
              </button>
              {showSuggestButton && (
                <button 
                  className="btn-suggest-friend" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSuggestModal(true);
                  }}
                >
                  📤 Sugerir
                </button>
              )}
            </>
          ) : (
            <>
              {isInCollection ? (
                // Filme já está na sua coleção - mostrar badge
                <div className="already-in-collection-badge">
                  <span className="badge-icon">✓</span>
                  <span className="badge-text">Na sua coleção</span>
                </div>
              ) : (
                // Filme NÃO está na sua coleção - mostrar botão para adicionar
                <>
                  {!showAddOptions ? (
                    <button className="btn-add-to-collection" onClick={handleAddClick} disabled={adding}>
                      {adding ? 'Adicionando...' : '➕ Adicionar à Minha Coleção'}
                    </button>
                  ) : (
                    <div className="add-to-collection-options">
                      <select value={addStatus} onChange={(e) => setAddStatus(e.target.value)}>
                        <option value="quero_ver">Quero Ver</option>
                        <option value="assistindo">Assistindo</option>
                        <option value="rever">Quero Ver Novamente</option>
                        <option value="ja_vi">Já Vi</option>
                      </select>
                      <button className="btn-confirm-add" onClick={handleConfirmAdd} disabled={adding}>
                        {adding ? 'Confirmando...' : '✓ Confirmar'}
                      </button>
                      <button className="btn-cancel-add" onClick={handleCancelAdd} disabled={adding}>
                        ✕ Cancelar
                      </button>
                    </div>
                  )}
                  {addSuccess && <span className="add-success-message">{addSuccess}</span>}
                  {addError && <span className="add-error-message">{addError}</span>}
                </>
              )}
            </>
          )}
        </div>
      </div>
      </div>
      
      {/* Modal de sugestão - renderizado fora do card */}
      {showSuggestModal && (
        <SuggestToFriendModal 
          media={media} 
          onClose={() => setShowSuggestModal(false)} 
        />
      )}
    </>
  );
}

export default MediaCard;
