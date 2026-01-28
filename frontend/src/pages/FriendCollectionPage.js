import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import MediaCard from '../components/MediaCard';
import Filters from '../components/Filters';
import { Loading, ErrorMessage } from '../components/Loading';
import './FriendCollectionPage.css';

function FriendCollectionPage() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [friendData, setFriendData] = useState(null);
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [myMediaIds, setMyMediaIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFriendCollection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar coleção do amigo E sua coleção em paralelo para melhor performance
      const [friendResponse, myMediaResponse] = await Promise.all([
        api.get(`/friends/${friendId}/media`),
        api.get('/media')
      ]);
      
      setFriendData(friendResponse.data.data.friend);
      setMedia(friendResponse.data.data.media);
      setFilteredMedia(friendResponse.data.data.media);
      
      // Criar Set com seus IDs de filmes para comparação rápida O(1)
      const myIds = new Set();
      myMediaResponse.data.data.forEach(item => {
        // Usar IMDB ID se disponível (mais confiável para identificar o mesmo filme)
        if (item.imdb_id) {
          myIds.add(item.imdb_id);
        }
        // Fallback: usar título + ano como identificador único
        const key = `${item.title.toLowerCase()}_${item.year || ''}`;
        myIds.add(key);
      });
      setMyMediaIds(myIds);
      
    } catch (err) {
      console.error('Erro ao carregar coleção:', err);
      if (err.response?.status === 403) {
        setError('Você não tem permissão para ver esta coleção. Vocês precisam ser amigos.');
      } else if (err.response?.status === 404) {
        setError('Usuário não encontrado.');
      } else {
        setError('Erro ao carregar coleção do amigo.');
      }
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  useEffect(() => {
    loadFriendCollection();
    window.scrollTo(0, 0);
  }, [loadFriendCollection]);

  const handleFilter = (filters) => {
    let results = [...media];

    if (filters.title) {
      results = results.filter(item => 
        item.title && item.title.toLowerCase().includes(filters.title.toLowerCase())
      );
    }

    if (filters.director) {
      results = results.filter(item => 
        item.director && item.director.toLowerCase().includes(filters.director.toLowerCase())
      );
    }

    if (filters.actors) {
      results = results.filter(item => 
        item.actors && item.actors.toLowerCase().includes(filters.actors.toLowerCase())
      );
    }

    setFilteredMedia(results);
  };

  const handleClearFilter = () => {
    setFilteredMedia(media);
  };

  const handleAddToMyCollection = async (mediaItem, selectedStatus) => {
    try {
      // Criar novo item na coleção do usuário atual
      const newMedia = {
        title: mediaItem.title,
        type: mediaItem.type,
        genre: mediaItem.genre,
        status: selectedStatus,
        imdb_id: mediaItem.imdb_id,
        imdb_rating: mediaItem.imdb_rating,
        poster_url: mediaItem.poster_url,
        plot: mediaItem.plot,
        year: mediaItem.year,
        director: mediaItem.director,
        actors: mediaItem.actors,
        runtime: mediaItem.runtime,
        country: mediaItem.country,
        notes: `Adicionado da coleção de ${friendData.name}`
      };

      await api.post('/media', newMedia);
      
      alert(`"${mediaItem.title}" foi adicionado à sua coleção com status "${getStatusLabel(selectedStatus)}"!`);
    } catch (err) {
      console.error('Erro ao adicionar à coleção:', err);
      if (err.response?.status === 409) {
        // Filme já existe na coleção
        const duplicate = err.response.data.duplicate;
        if (duplicate && duplicate.id) {
          const goToExisting = window.confirm(
            `"${mediaItem.title}" já está na sua coleção!\n\nDeseja ver o filme existente?`
          );
          if (goToExisting) {
            navigate(`/details/${duplicate.id}`);
          }
        } else {
          alert(`"${mediaItem.title}" já está na sua coleção!`);
        }
      } else {
        alert('Erro ao adicionar à sua coleção. Tente novamente.');
      }
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'quero_ver': 'Quero Ver',
      'assistindo': 'Assistindo',
      'rever': 'Quero Ver Novamente',
      'ja_vi': 'Já Vi'
    };
    return labels[status] || status;
  };

  if (loading) return <Loading />;
  if (error) return (
    <div className="friend-collection-page">
      <ErrorMessage message={error} />
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button className="btn-back" onClick={() => navigate('/friends')}>
          ← Voltar para Amigos
        </button>
      </div>
    </div>
  );

  const groupedMedia = {
    quero_ver: filteredMedia.filter(item => item.status === 'quero_ver'),
    assistindo: filteredMedia.filter(item => item.status === 'assistindo'),
    rever: filteredMedia.filter(item => item.status === 'rever'),
    ja_vi: filteredMedia.filter(item => item.status === 'ja_vi')
  };

  return (
    <div className="friend-collection-page">
      <div className="friend-collection-header">
        <button className="btn-back-header" onClick={() => navigate('/friends')}>
          ← Voltar
        </button>
        <h1>📚 Coleção de {friendData?.name}</h1>
        <p>Explore a coleção do seu amigo e adicione filmes/séries à sua própria biblioteca</p>
        <span className="readonly-badge">👀 Modo Visualização</span>
      </div>

      {media.length > 0 && (
        <>
          <Filters onFilter={handleFilter} onClear={handleClearFilter} />
          
          <div className="collection-stats">
            <div className="stat-item">
              <span className="stat-number">{media.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{groupedMedia.quero_ver.length}</span>
              <span className="stat-label">Quero Ver</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{groupedMedia.assistindo.length}</span>
              <span className="stat-label">Assistindo</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{groupedMedia.rever.length}</span>
              <span className="stat-label">Rever</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{groupedMedia.ja_vi.length}</span>
              <span className="stat-label">Já Vi</span>
            </div>
          </div>
        </>
      )}

      {filteredMedia.length === 0 && media.length > 0 && (
        <div className="no-results">
          <p>Nenhum resultado encontrado com os filtros aplicados.</p>
        </div>
      )}

      {media.length === 0 && (
        <div className="empty-collection">
          <p className="empty-icon">📭</p>
          <p className="empty-text">{friendData?.name} ainda não tem filmes ou séries cadastrados.</p>
        </div>
      )}

      {groupedMedia.quero_ver.length > 0 && (
        <div className="media-section">
          <h2 className="section-title quero-ver">
            <span className="section-icon">⭐</span>
            Quero Ver
            <span className="section-count">{groupedMedia.quero_ver.length}</span>
          </h2>
          <div className="media-grid">
            {groupedMedia.quero_ver.map(item => {
              // Verificar se você já tem este filme na sua coleção
              const imdbKey = item.imdb_id;
              const titleKey = `${item.title.toLowerCase()}_${item.year || ''}`;
              const alreadyInCollection = myMediaIds.has(imdbKey) || myMediaIds.has(titleKey);
              
              return (
                <MediaCard
                  key={item.id}
                  media={item}
                  readOnly={true}
                  alreadyInCollection={alreadyInCollection}
                  onAddToCollection={handleAddToMyCollection}
                />
              );
            })}
          </div>
        </div>
      )}

      {groupedMedia.assistindo.length > 0 && (
        <div className="media-section">
          <h2 className="section-title assistindo">
            <span className="section-icon">📺</span>
            Assistindo
            <span className="section-count">{groupedMedia.assistindo.length}</span>
          </h2>
          <div className="media-grid">
            {groupedMedia.assistindo.map(item => {
              const imdbKey = item.imdb_id;
              const titleKey = `${item.title.toLowerCase()}_${item.year || ''}`;
              const alreadyInCollection = myMediaIds.has(imdbKey) || myMediaIds.has(titleKey);
              
              return (
                <MediaCard
                  key={item.id}
                  media={item}
                  readOnly={true}
                  alreadyInCollection={alreadyInCollection}
                  onAddToCollection={handleAddToMyCollection}
                />
              );
            })}
          </div>
        </div>
      )}

      {groupedMedia.rever.length > 0 && (
        <div className="media-section">
          <h2 className="section-title rever">
            <span className="section-icon">🔄</span>
            Quero Ver Novamente
            <span className="section-count">{groupedMedia.rever.length}</span>
          </h2>
          <div className="media-grid">
            {groupedMedia.rever.map(item => {
              const imdbKey = item.imdb_id;
              const titleKey = `${item.title.toLowerCase()}_${item.year || ''}`;
              const alreadyInCollection = myMediaIds.has(imdbKey) || myMediaIds.has(titleKey);
              
              return (
                <MediaCard
                  key={item.id}
                  media={item}
                  readOnly={true}
                  alreadyInCollection={alreadyInCollection}
                  onAddToCollection={handleAddToMyCollection}
                />
              );
            })}
          </div>
        </div>
      )}

      {groupedMedia.ja_vi.length > 0 && (
        <div className="media-section">
          <h2 className="section-title ja-vi">
            <span className="section-icon">✅</span>
            Já Vi
            <span className="section-count">{groupedMedia.ja_vi.length}</span>
          </h2>
          <div className="media-grid">
            {groupedMedia.ja_vi.map(item => {
              const imdbKey = item.imdb_id;
              const titleKey = `${item.title.toLowerCase()}_${item.year || ''}`;
              const alreadyInCollection = myMediaIds.has(imdbKey) || myMediaIds.has(titleKey);
              
              return (
                <MediaCard
                  key={item.id}
                  media={item}
                  readOnly={true}
                  alreadyInCollection={alreadyInCollection}
                  onAddToCollection={handleAddToMyCollection}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendCollectionPage;
