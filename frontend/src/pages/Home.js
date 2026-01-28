import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mediaService } from '../services/api';
import MediaCard from '../components/MediaCard';
import Filters from '../components/Filters';
import { Loading, ErrorMessage } from '../components/Loading';
import './Home.css';

function Home() {
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mediaService.getAll();
      setMedia(response.data.data); // Ajustado para nova estrutura
      setFilteredMedia(response.data.data);
    } catch (err) {
      console.error('Erro ao carregar media:', err);
      setError('Erro ao carregar filmes e séries. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (filters) => {
    try {
      setLoading(true);
      setError(null);

      // Se houver busca por texto, usar o endpoint de busca
      if (filters.search) {
        const response = await mediaService.search(filters.search);
        let results = response.data.data || response.data; // Compatibilidade

        // Aplicar filtros adicionais
        if (filters.status) {
          results = results.filter(item => item.status === filters.status);
        }
        if (filters.type) {
          results = results.filter(item => item.type === filters.type);
        }
        if (filters.genre) {
          results = results.filter(item => 
            item.genre && item.genre.toLowerCase().includes(filters.genre.toLowerCase())
          );
        }

        setFilteredMedia(results);
      } else {
        // Usar endpoint com filtros de query
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.type) params.type = filters.type;
        if (filters.genre) params.genre = filters.genre;

        const response = await mediaService.getAll(params);
        setFilteredMedia(response.data.data); // Ajustado para nova estrutura
      }
    } catch (err) {
      console.error('Erro ao filtrar:', err);
      setError('Erro ao filtrar resultados.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilteredMedia(media);
  };

  // Agrupar mídia por status
  const groupedMedia = {
    quero_ver: filteredMedia.filter(item => item.status === 'quero_ver'),
    assistindo: filteredMedia.filter(item => item.status === 'assistindo'),
    ja_vi: filteredMedia.filter(item => item.status === 'ja_vi')
  };

  const handleDelete = async (id) => {
    try {
      await mediaService.delete(id);
      // Atualizar lista local
      const updatedMedia = media.filter(item => item.id !== id);
      setMedia(updatedMedia);
      setFilteredMedia(updatedMedia);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir filme/série.');
    }
  };

  if (loading && media.length === 0) {
    return (
      <div className="home container">
        <Loading />
      </div>
    );
  }

  return (
    <div className="home container">
      <div className="home-header">
        <h1>Minha Coleção de Filmes e Séries</h1>
        {media.length === 0 ? (
          <div className="welcome-message">
            <p>
              Bem vindo! Neste site você poderá cadastrar seu histórico de produções 
              cinematográficas, fazer sua avaliação, cadastrar suas observações e experiência, 
              informar quais séries e filmes você está atualmente assistindo - vale mais pra 
              séries, né? - e ainda deixar registrada aquela lista do que você pretende assistir 
              para não esquecer e poder recorrer sempre que for assistir um filme novo ou começar 
              uma série nova. Use sem moderação, navegue e se perca nos links cruzados de atores, 
              atrizes e diretores. Ah, ainda rola um dashboard para você poder se surpreender com 
              seus próprios números. Se quiser deixar um feedback depois, não hesite, envie um 
              email para <a href="mailto:julio.bisneto@gmail.com">julio.bisneto@gmail.com</a> ou 
              uma mensagem para <a href="https://wa.me/5521984866404" target="_blank" rel="noopener noreferrer">21 984866404</a>. 
              Abraços 🎬
            </p>
          </div>
        ) : (
          <p>Gerencie seus filmes e séries favoritos</p>
        )}
      </div>

      {/* Só mostrar filtros se houver filmes cadastrados */}
      {media.length > 0 && (
        <Filters onFilter={handleFilter} onClear={handleClearFilters} />
      )}

      {error && <ErrorMessage message={error} />}

      {!error && filteredMedia.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p className="empty-text">
            Nenhum filme ou série encontrado.{' '}
            <Link to="/add" className="add-first-link">
              Adicione o primeiro!
            </Link>
          </p>
        </div>
      )}

      {!error && filteredMedia.length > 0 && (
        <div className="media-sections">
          {groupedMedia.quero_ver.length > 0 && (
            <div className="media-section">
              <h2 className="section-title priority">
                <span className="section-icon">⭐</span>
                Quero Ver
                <span className="section-count">{groupedMedia.quero_ver.length}</span>
              </h2>
              <div className="media-grid">
                {groupedMedia.quero_ver.map(item => (
                  <MediaCard
                    key={item.id}
                    media={item}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedMedia.assistindo.length > 0 && (
            <div className="media-section">
              <h2 className="section-title watching">
                <span className="section-icon">▶️</span>
                Assistindo
                <span className="section-count">{groupedMedia.assistindo.length}</span>
              </h2>
              <div className="media-grid">
                {groupedMedia.assistindo.map(item => (
                  <MediaCard
                    key={item.id}
                    media={item}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedMedia.ja_vi.length > 0 && (
            <div className="media-section">
              <h2 className="section-title watched">
                <span className="section-icon">✓</span>
                Já Vi
                <span className="section-count">{groupedMedia.ja_vi.length}</span>
              </h2>
              <div className="media-grid">
                {groupedMedia.ja_vi.map(item => (
                  <MediaCard
                    key={item.id}
                    media={item}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
