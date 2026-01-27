import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tmdbService from '../services/tmdbService';
import { Loading, ErrorMessage } from '../components/Loading';
import './PersonPage.css';

function PersonPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [movieCredits, setMovieCredits] = useState(null);
  const [activeTab, setActiveTab] = useState('actor'); // 'actor' ou 'director'

  // Buscar pessoa por nome ao carregar
  const searchPerson = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await tmdbService.searchPerson(name, 'pt-BR');
      const results = response.data || [];
      
      if (results.length > 0) {
        // Selecionar o primeiro resultado automaticamente
        handleSelectPerson(results[0]);
        setSearchResults(results);
      } else {
        setError(`Nenhuma pessoa encontrada com o nome "${name}".`);
      }
    } catch (err) {
      console.error('Erro ao buscar pessoa:', err);
      setError('Erro ao buscar informações da pessoa.');
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    if (name) {
      searchPerson();
    }
  }, [name, searchPerson]);

  const handleSelectPerson = async (person) => {
    try {
      setLoading(true);
      setError(null);
      
      setSelectedPerson(person);
      
      // Buscar filmografia
      const creditsResponse = await tmdbService.getPersonMovieCredits(person.tmdb_person_id, 'pt-BR');
      setMovieCredits(creditsResponse.data);
      
      // Definir tab ativo baseado no departamento
      if (person.known_for_department === 'Directing') {
        setActiveTab('director');
      } else {
        setActiveTab('actor');
      }
    } catch (err) {
      console.error('Erro ao buscar créditos:', err);
      setError('Erro ao buscar filmografia.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="person-page container">
        <Loading />
      </div>
    );
  }

  if (error && !selectedPerson) {
    return (
      <div className="person-page container">
        <ErrorMessage message={error} />
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="person-page container">
      {/* Header com informações da pessoa */}
      {selectedPerson && (
        <div className="person-header">
          <button className="btn-back-header" onClick={() => navigate(-1)}>
            ← Voltar
          </button>
          
          <div className="person-info">
            {selectedPerson.profile_path && (
              <div className="person-photo">
                <img src={selectedPerson.profile_path} alt={selectedPerson.name} />
              </div>
            )}
            
            <div className="person-details">
              <h1>{selectedPerson.name}</h1>
              
              {selectedPerson.known_for_department && (
                <div className="person-department">
                  <span className="department-badge">
                    {selectedPerson.known_for_department === 'Acting' ? '🎭 Ator/Atriz' : 
                     selectedPerson.known_for_department === 'Directing' ? '🎬 Diretor(a)' : 
                     selectedPerson.known_for_department}
                  </span>
                </div>
              )}
              
              {selectedPerson.known_for && (
                <div className="person-known-for">
                  <strong>Conhecido(a) por:</strong> {selectedPerson.known_for}
                </div>
              )}
            </div>
          </div>

          {/* Outros resultados */}
          {searchResults.length > 1 && (
            <div className="other-results">
              <p>Outras pessoas com nome similar:</p>
              <div className="person-select-list">
                {searchResults.slice(0, 5).map((person) => (
                  <button
                    key={person.tmdb_person_id}
                    className={`person-select-item ${selectedPerson.tmdb_person_id === person.tmdb_person_id ? 'active' : ''}`}
                    onClick={() => handleSelectPerson(person)}
                  >
                    <span>{person.name}</span>
                    <span className="person-dept">
                      {person.known_for_department === 'Acting' ? '🎭' : 
                       person.known_for_department === 'Directing' ? '🎬' : '🎥'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filmografia */}
      {movieCredits && (
        <div className="person-filmography">
          <div className="filmography-tabs">
            {movieCredits.as_actor && movieCredits.as_actor.length > 0 && (
              <button
                className={`tab-btn ${activeTab === 'actor' ? 'active' : ''}`}
                onClick={() => setActiveTab('actor')}
              >
                🎭 Como Ator/Atriz ({movieCredits.as_actor.length})
              </button>
            )}
            
            {movieCredits.as_director && movieCredits.as_director.length > 0 && (
              <button
                className={`tab-btn ${activeTab === 'director' ? 'active' : ''}`}
                onClick={() => setActiveTab('director')}
              >
                🎬 Como Diretor(a) ({movieCredits.as_director.length})
              </button>
            )}
          </div>

          <div className="filmography-content">
            {activeTab === 'actor' && movieCredits.as_actor && (
              <div className="movies-grid">
                {movieCredits.as_actor.map((movie) => (
                  <div key={movie.tmdb_id} className="movie-card">
                    <div className="movie-poster">
                      {movie.poster ? (
                        <img src={movie.poster} alt={movie.title_pt || movie.title} />
                      ) : (
                        <div className="no-poster">🎬</div>
                      )}
                    </div>
                    <div className="movie-info">
                      <div className="movie-title">
                        {movie.title_pt || movie.title}
                      </div>
                      {movie.year && (
                        <div className="movie-year">{movie.year}</div>
                      )}
                      {movie.character && (
                        <div className="movie-character">
                          como <em>{movie.character}</em>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'director' && movieCredits.as_director && (
              <div className="movies-grid">
                {movieCredits.as_director.map((movie) => (
                  <div key={movie.tmdb_id} className="movie-card">
                    <div className="movie-poster">
                      {movie.poster ? (
                        <img src={movie.poster} alt={movie.title_pt || movie.title} />
                      ) : (
                        <div className="no-poster">🎬</div>
                      )}
                    </div>
                    <div className="movie-info">
                      <div className="movie-title">
                        {movie.title_pt || movie.title}
                      </div>
                      {movie.year && (
                        <div className="movie-year">{movie.year}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PersonPage;
