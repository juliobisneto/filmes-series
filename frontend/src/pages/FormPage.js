import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { mediaService, omdbService } from '../services/api';
import tmdbService from '../services/tmdbService';
import { Loading, ErrorMessage } from '../components/Loading';
import './FormPage.css';

function FormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const searchInputRef = useRef(null);

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('tmdb'); // 'tmdb' ou 'imdb'
  const [searchFilters, setSearchFilters] = useState({
    year: '',
    type: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    type: 'movie',
    genre: '',
    status: 'ja_vi',
    rating: 0,
    notes: '',
    date_watched: '',
    imdb_id: '',
    imdb_rating: '',
    poster_url: '',
    plot: '',
    year: '',
    director: '',
    actors: '',
    runtime: '',
    country: ''
  });

  // Função para formatar data do banco (YYYY-MM-DD ou ISO) para input date
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Se já está no formato YYYY-MM-DD, retorna direto
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    // Se está em ISO (com hora), extrai só a data
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const response = await mediaService.getById(id);
      const data = response.data.data; // Ajustado para nova estrutura
      // Formatar data antes de setar no estado
      if (data.date_watched) {
        data.date_watched = formatDateForInput(data.date_watched);
      }
      setFormData(data);
    } catch (err) {
      console.error('Erro ao carregar:', err);
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      loadMedia();
    } else {
      // Verificar se há dados pré-preenchidos vindos do PreviewPage
      if (location.state?.prefilledData) {
        const prefilled = location.state.prefilledData;
        setFormData(prev => ({
          ...prev,
          ...prefilled,
          // Formatar data se vier preenchida
          date_watched: prefilled.date_watched ? formatDateForInput(prefilled.date_watched) : prev.date_watched
        }));
        // Limpar o state para não interferir em futuras navegações
        window.history.replaceState({}, document.title);
      } else {
        // Dar foco no campo de busca quando estiver adicionando novo filme
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    }
  }, [isEdit, loadMedia, location.state]);

  const handleSearchIMDB = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setError(null);
      
      if (searchSource === 'tmdb') {
        // Busca no TMDB (aceita português!)
        const response = await tmdbService.searchHybrid(searchQuery, 'pt-BR');
        const results = response.data || [];
        
        // Formatar resultados do TMDB para o formato esperado
        const formattedResults = results.map(movie => ({
          imdbID: movie.imdb_id || `tmdb_${movie.tmdb_id}`,
          tmdb_id: movie.tmdb_id,
          Title: movie.title_pt || movie.title,
          OriginalTitle: movie.original_title,
          Year: movie.year,
          Type: movie.type || 'movie',
          Poster: movie.poster || 'N/A',
          Plot: movie.plot,
          source: 'tmdb'
        }));
        
        setSearchResults(formattedResults);
        
        if (formattedResults.length === 0) {
          setError('Nenhum resultado encontrado no TMDB.');
        }
      } else {
        // Busca no IMDB (original - só aceita inglês)
        const searchParams = { title: searchQuery };
        if (searchFilters.year) {
          searchParams.year = searchFilters.year;
        }
        if (searchFilters.type) {
          searchParams.type = searchFilters.type;
        }
        
        const response = await omdbService.search(searchParams);
        const results = response.data.results || [];
        
        // Adicionar source='imdb' aos resultados
        const formattedResults = results.map(r => ({ ...r, source: 'imdb' }));
        
        // Sempre atualizar os resultados (limpa se vazio)
        setSearchResults(formattedResults);
        
        if (results.length === 0) {
          setError('Nenhum resultado encontrado no IMDB com esses filtros.');
        }
      }
    } catch (err) {
      console.error(`Erro ao buscar no ${searchSource.toUpperCase()}:`, err);
      setError(err.response?.data?.error || `Erro ao buscar no ${searchSource.toUpperCase()}.`);
      // Limpar resultados em caso de erro também
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectIMDB = async (result) => {
    try {
      // #region agent log
      console.log('[DEBUG FormPage.js:161] handleSelectIMDB called:', JSON.stringify({
        source: result.source,
        type: result.Type,
        tmdb_id: result.tmdb_id,
        title: result.Title,
        hypothesisId: 'F,G,H',
        runId: 'pre-fix'
      }));
      // #endregion
      
      setLoading(true);
      setError(null);
      
      let details;
      
      if (result.source === 'tmdb') {
        // #region agent log
        console.log('[DEBUG FormPage.js:170] Fetching TMDB details for:', JSON.stringify({
          tmdb_id: result.tmdb_id,
          type: result.Type,
          endpoint: result.Type === 'series' ? `/tmdb/tv/${result.tmdb_id}` : `/tmdb/movie/${result.tmdb_id}`,
          hypothesisId: 'H',
          runId: 'post-fix'
        }));
        // #endregion
        
        // Se veio do TMDB, buscar detalhes completos no TMDB
        // Verificar se é filme ou série para chamar o endpoint correto
        let response;
        if (result.Type === 'series') {
          response = await tmdbService.getTvShowDetails(result.tmdb_id, 'pt-BR');
        } else {
          response = await tmdbService.getMovieDetails(result.tmdb_id, 'pt-BR');
        }
        details = response.data;
        
        // #region agent log
        console.log('[DEBUG FormPage.js:180] TMDB details received:', JSON.stringify({
          title: details.title_pt || details.title,
          type: details.type,
          tmdb_id: details.tmdb_id,
          year: details.year,
          hypothesisId: 'H',
          runId: 'post-fix'
        }));
        // #endregion
        
        // Preencher formulário com dados do TMDB
        setFormData(prev => ({
          ...prev,
          title: details.title_pt || details.title,
          type: details.type || 'movie',
          genre: details.genres || '',
          imdb_id: details.imdb_id || '',
          imdb_rating: details.vote_average ? details.vote_average.toString() : '',
          poster_url: details.poster || '',
          plot: details.plot || '',
          year: details.year || '',
          director: details.director || '',
          actors: details.actors || '',
          runtime: details.runtime || '',
          country: details.country || ''
        }));
      } else {
        // Se veio do IMDB, buscar detalhes completos no IMDB
        const response = await omdbService.getByImdbId(result.imdbID);
        details = response.data;

        // Preencher formulário com dados do IMDB
        setFormData(prev => ({
          ...prev,
          title: details.title || result.Title,
          type: details.type || (result.Type === 'movie' ? 'movie' : 'series'),
          genre: details.genre || '',
          imdb_id: details.imdb_id || result.imdbID,
          imdb_rating: details.imdb_rating || '',
          poster_url: details.poster_url || (result.Poster !== 'N/A' ? result.Poster : ''),
          plot: details.plot || '',
          year: details.year || result.Year,
          director: details.director || '',
          actors: details.actors || '',
          runtime: details.runtime || '',
          country: details.country || ''
        }));
      }

      setSearchResults([]);
      setSearchQuery('');
      setSearchFilters({ year: '', type: '' });
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setError(`Erro ao carregar detalhes do ${result.source === 'tmdb' ? 'TMDB' : 'IMDB'}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type) {
      setError('Título e tipo são obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEdit) {
        await mediaService.update(id, formData);
        navigate('/');
      } else {
        const response = await mediaService.create(formData);
        const newMediaId = response.data?.data?.id || response.data?.id;
        
        if (!newMediaId) {
          setError('Erro: filme criado mas ID não retornado.');
          return;
        }
        
        navigate(`/details/${newMediaId}`);
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      
      // Tratamento específico para duplicatas (409 Conflict)
      if (err.response?.status === 409) {
        const duplicate = err.response.data.duplicate;
        
        if (duplicate) {
          const confirmMessage = `Este filme já está na sua biblioteca:

📽️ ${duplicate.title}${duplicate.year ? ` (${duplicate.year})` : ''}

Deseja visualizar o filme cadastrado?`;
          
          if (window.confirm(confirmMessage)) {
            navigate(`/details/${duplicate.id}`);
          } else {
            setError(err.response.data.error || 'Este filme já está na sua biblioteca');
          }
        } else {
          setError(err.response.data.error || 'Este filme já está na sua biblioteca');
        }
      } else {
        setError(err.response?.data?.error || 'Erro ao salvar.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= formData.rating ? 'filled' : ''}`}
          onClick={() => handleRatingChange(i)}
        >
          {i <= formData.rating ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  if (loading && isEdit) {
    return (
      <div className="form-page container">
        <Loading />
      </div>
    );
  }

  return (
    <div className="form-page container">
      <div className="form-container">
        <div className="form-header">
          <h1>{isEdit ? 'Editar' : 'Adicionar'} Filme/Série</h1>
          <p>{isEdit ? 'Atualize as informações' : 'Busque no IMDB ou preencha manualmente'}</p>
        </div>

        {!isEdit && (
          <div className="imdb-search-section">
            <h2>
              <span>🔍</span> Buscar Filme/Série
            </h2>
            
            {/* Seletor de fonte de busca */}
            <div className="search-source-selector">
              <button
                type="button"
                className={`source-btn ${searchSource === 'tmdb' ? 'active' : ''}`}
                onClick={() => setSearchSource('tmdb')}
              >
                <span className="source-icon">🌐</span>
                <span className="source-name">TMDB</span>
                <span className="source-desc">(Aceita português)</span>
              </button>
              <button
                type="button"
                className={`source-btn ${searchSource === 'imdb' ? 'active' : ''}`}
                onClick={() => setSearchSource('imdb')}
              >
                <span className="source-icon">🎬</span>
                <span className="source-name">IMDB</span>
                <span className="source-desc">(Só inglês)</span>
              </button>
            </div>
            
            <div className="search-tip">
              <span className="tip-icon">💡</span>
              <span className="tip-text">
                {searchSource === 'tmdb' ? (
                  <>
                    <strong>TMDB:</strong> Busque em português! 
                    <br />
                    <em>Ex: "De Volta Para o Futuro" funciona perfeitamente</em>
                  </>
                ) : (
                  <>
                    <strong>IMDB:</strong> Use o título original em inglês. 
                    <br />
                    <em>Ex: "Back to the Future" ao invés de "De Volta Para o Futuro"</em>
                  </>
                )}
              </span>
            </div>

            <div className="search-input-group">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchIMDB()}
                placeholder={searchSource === 'tmdb' 
                  ? "Digite o título em português ou inglês..." 
                  : "Digite o título em inglês (ex: Back to the Future)..."
                }
              />
              <button
                className="btn-search-imdb"
                onClick={handleSearchIMDB}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {searchSource === 'imdb' && (
              <div className="search-filters">
                <div className="filter-group">
                  <label htmlFor="search-year">Ano:</label>
                  <input
                    id="search-year"
                    type="number"
                    value={searchFilters.year}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="Ex: 2024"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="search-type">Tipo:</label>
                  <select
                    id="search-type"
                    value={searchFilters.type}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="movie">Filme</option>
                    <option value="series">Série</option>
                  </select>
                </div>
                {(searchFilters.year || searchFilters.type) && (
                  <button
                    className="btn-clear-filters"
                    onClick={() => setSearchFilters({ year: '', type: '' })}
                    title="Limpar filtros"
                  >
                    ✕ Limpar
                  </button>
                )}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(result => (
                  <div
                    key={result.imdbID}
                    className="search-result-item"
                    onClick={() => handleSelectIMDB(result)}
                  >
                    <div className="search-result-poster">
                      {result.Poster && result.Poster !== 'N/A' ? (
                        <img src={result.Poster} alt={result.Title} />
                      ) : (
                        <span>🎬</span>
                      )}
                    </div>
                    <div className="search-result-info">
                      <div className="search-result-title">
                        {result.Title}
                        {result.OriginalTitle && result.OriginalTitle !== result.Title && (
                          <span className="original-title"> ({result.OriginalTitle})</span>
                        )}
                      </div>
                      <div className="search-result-details">
                        <span>{result.Year}</span>
                        <span>•</span>
                        <span>{result.Type === 'movie' ? 'Filme' : 'Série'}</span>
                        <span>•</span>
                        <span className={`source-badge ${result.source}`}>
                          {result.source === 'tmdb' ? 'TMDB' : 'IMDB'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        {formData.imdb_id && (
          <div className="info-message">
            ✓ Dados importados do IMDB! Você pode editar conforme necessário.
          </div>
        )}

        <form className="media-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>
                Título <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>
                Tipo <span className="required">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="movie">Filme</option>
                <option value="series">Série</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gênero</label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                placeholder="Ex: Ação, Drama, Comédia"
              />
            </div>

            <div className="form-group">
              <label>Ano</label>
              <input
                type="text"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="Ex: 2024"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Status <span className="required">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="quero_ver">Quero Ver</option>
                <option value="assistindo">Assistindo</option>
                <option value="ja_vi">Já Vi</option>
                <option value="rever">Já vi, mas quero ver novamente</option>
              </select>
            </div>

            <div className="form-group">
              <label>Data que assistiu</label>
              <input
                type="date"
                name="date_watched"
                value={formData.date_watched || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Minha Avaliação</label>
            <div className="star-rating">
              {renderStars()}
              <span style={{ marginLeft: '10px', color: 'var(--text-secondary)' }}>
                {formData.rating > 0 ? `${formData.rating}/5` : 'Não avaliado'}
              </span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Diretor</label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Duração</label>
              <input
                type="text"
                name="runtime"
                value={formData.runtime}
                onChange={handleChange}
                placeholder="Ex: 120 min"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>País de Origem</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Ex: USA, UK"
              />
            </div>

            <div className="form-group">
              <label>Diretor</label>
              <input
                type="text"
                name="director"
                value={formData.director}
                onChange={handleChange}
                placeholder="Ex: Steven Spielberg"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Elenco</label>
            <input
              type="text"
              name="actors"
              value={formData.actors}
              onChange={handleChange}
              placeholder="Ex: Actor 1, Actor 2, Actor 3"
            />
          </div>

          <div className="form-group full-width">
            <label>Sinopse</label>
            <textarea
              name="plot"
              value={formData.plot}
              onChange={handleChange}
              placeholder="Descrição do filme/série..."
            />
          </div>

          <div className="form-group full-width">
            <label>Minhas Anotações</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Suas observações pessoais..."
            />
          </div>

          <div className="form-group full-width">
            <label>URL do Poster</label>
            <input
              type="url"
              name="poster_url"
              value={formData.poster_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Adicionar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormPage;
