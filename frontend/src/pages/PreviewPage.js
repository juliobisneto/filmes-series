import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tmdbService from '../services/tmdbService';
import mediaService from '../services/api';
import { Loading, ErrorMessage } from '../components/Loading';
import './PreviewPage.css';

function PreviewPage() {
  const { tmdbId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [checkingLibrary, setCheckingLibrary] = useState(true);

  useEffect(() => {
    // Rolar para o topo da página ao carregar
    window.scrollTo(0, 0);
    loadMovieDetails();
  }, [tmdbId]);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar detalhes do filme no TMDB
      const response = await tmdbService.getMovieDetails(tmdbId, 'pt-BR');
      setMovieDetails(response.data);
      
      // Verificar se já está na biblioteca
      await checkIfInLibrary(response.data);
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
      setError('Erro ao carregar informações do filme/série.');
    } finally {
      setLoading(false);
    }
  };

  const checkIfInLibrary = async (movie) => {
    try {
      setCheckingLibrary(true);
      // Buscar na biblioteca local por IMDB ID
      const response = await mediaService.search('');
      const library = response.data.data || [];
      
      const exists = library.some(item => 
        item.imdb_id === movie.imdb_id || 
        item.title === movie.title
      );
      
      setIsInLibrary(exists);
    } catch (err) {
      console.error('Erro ao verificar biblioteca:', err);
    } finally {
      setCheckingLibrary(false);
    }
  };

  const handleAddToLibrary = () => {
    if (!movieDetails) return;
    
    // Navegar para FormPage com dados pré-preenchidos via state
    navigate('/add', { 
      state: { 
        prefilledData: {
          title: movieDetails.title_pt || movieDetails.title,
          type: movieDetails.type || 'movie',
          genre: movieDetails.genres || '',
          imdb_id: movieDetails.imdb_id || '',
          imdb_rating: movieDetails.vote_average ? movieDetails.vote_average.toString() : '',
          poster_url: movieDetails.poster || '',
          plot: movieDetails.plot || movieDetails.overview || '',
          year: movieDetails.year || '',
          director: movieDetails.director || '',
          actors: movieDetails.actors || '',
          runtime: movieDetails.runtime || '',
          country: movieDetails.country || '',
          status: 'ja_vi'
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="preview-page container">
        <Loading />
      </div>
    );
  }

  if (error || !movieDetails) {
    return (
      <div className="preview-page container">
        <ErrorMessage message={error || 'Filme não encontrado'} />
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="preview-page container">
      <button className="btn-back-header" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <div className="preview-content">
        {/* Poster e Informações Principais */}
        <div className="preview-header">
          <div className="preview-poster">
            {movieDetails.poster ? (
              <img src={movieDetails.poster} alt={movieDetails.title_pt || movieDetails.title} />
            ) : (
              <div className="no-poster">🎬</div>
            )}
          </div>

          <div className="preview-info">
            <h1>{movieDetails.title_pt || movieDetails.title}</h1>
            
            {movieDetails.title_pt && movieDetails.title !== movieDetails.title_pt && (
              <h2 className="original-title">{movieDetails.title}</h2>
            )}

            <div className="preview-meta">
              {movieDetails.year && (
                <span className="meta-item">📅 {movieDetails.year}</span>
              )}
              {movieDetails.runtime && (
                <span className="meta-item">⏱️ {movieDetails.runtime}</span>
              )}
              {movieDetails.vote_average && (
                <span className="meta-item rating">⭐ {movieDetails.vote_average}/10</span>
              )}
            </div>

            {movieDetails.genres && (
              <div className="preview-genres">
                {movieDetails.genres.split(',').map((genre, index) => (
                  <span key={index} className="genre-tag">
                    {genre.trim()}
                  </span>
                ))}
              </div>
            )}

            {(movieDetails.plot || movieDetails.overview) && (
              <div className="preview-overview">
                <h3>📖 Sinopse</h3>
                <p>{movieDetails.plot || movieDetails.overview}</p>
              </div>
            )}

            {/* Botão de Ação */}
            <div className="preview-actions">
              {checkingLibrary ? (
                <button className="btn-add" disabled>
                  🔍 Verificando...
                </button>
              ) : isInLibrary ? (
                <button className="btn-in-library" disabled>
                  ✅ Já está na sua biblioteca
                </button>
              ) : (
                <button className="btn-add" onClick={handleAddToLibrary}>
                  ➕ Adicionar à Biblioteca
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Detalhes Adicionais */}
        <div className="preview-details">
          {movieDetails.director && (
            <div className="detail-item">
              <strong>🎬 Direção:</strong>
              <span>{movieDetails.director}</span>
            </div>
          )}

          {movieDetails.actors && (
            <div className="detail-item">
              <strong>🎭 Elenco:</strong>
              <span>{movieDetails.actors}</span>
            </div>
          )}

          {movieDetails.country && (
            <div className="detail-item">
              <strong>🌍 País:</strong>
              <span>{movieDetails.country}</span>
            </div>
          )}

          {movieDetails.imdb_id && (
            <div className="detail-item">
              <strong>🎯 IMDB ID:</strong>
              <span>{movieDetails.imdb_id}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewPage;
