const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Serviço para integração com TMDB API
 * Funcionalidades:
 * - Busca de filmes e séries em português
 * - Busca de pessoas (atores/diretores)
 * - Obter detalhes completos de filmes e séries
 */

/**
 * Busca séries de TV por título (suporta português e outros idiomas)
 * @param {string} query - Título da série (pode ser em português)
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise<Array>} Lista de séries encontradas
 */
async function searchTvShow(query, language = 'pt-BR') {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/tv`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: language,
        include_adult: false
      }
    });

    return response.data.results.map(show => ({
      tmdb_id: show.id,
      imdb_id: null, // Será buscado depois se necessário
      title: show.name, // TV shows usam 'name' ao invés de 'title'
      original_title: show.original_name,
      title_pt: show.name, // Título em português (se language=pt-BR)
      year: show.first_air_date ? show.first_air_date.split('-')[0] : null,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      plot: show.overview || null,
      vote_average: show.vote_average || null,
      vote_count: show.vote_count || null,
      first_air_date: show.first_air_date || null,
      type: 'series' // Identifica como série
    }));
  } catch (error) {
    console.error('Erro ao buscar série no TMDB:', error.message);
    throw error;
  }
}

/**
 * Obtém detalhes completos de uma série de TV por TMDB ID
 * Inclui: créditos (atores, criadores), países, etc
 * @param {number} tmdbId - ID da série no TMDB
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise<Object>} Detalhes completos da série
 */
async function getTvShowDetails(tmdbId, language = 'pt-BR') {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: language,
        append_to_response: 'credits,external_ids'
      }
    });

    const show = response.data;
    const credits = show.credits || {};
    const cast = credits.cast || [];
    
    // Pega os criadores
    const creators = show.created_by ? show.created_by.map(c => c.name).join(', ') : null;
    
    // Pega os primeiros 5 atores
    const actors = cast.slice(0, 5).map(actor => actor.name).join(', ');

    return {
      tmdb_id: show.id,
      imdb_id: show.external_ids?.imdb_id || null,
      title: show.name,
      original_title: show.original_name,
      title_pt: show.name, // Título traduzido se language=pt-BR
      year: show.first_air_date ? show.first_air_date.split('-')[0] : null,
      first_air_date: show.first_air_date || null,
      last_air_date: show.last_air_date || null,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
      backdrop: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null,
      plot: show.overview || null,
      genres: show.genres ? show.genres.map(g => g.name).join(', ') : null,
      number_of_seasons: show.number_of_seasons || null,
      number_of_episodes: show.number_of_episodes || null,
      episode_run_time: show.episode_run_time && show.episode_run_time.length > 0 ? `${show.episode_run_time[0]} min` : null,
      vote_average: show.vote_average || null,
      vote_count: show.vote_count || null,
      country: show.origin_country ? show.origin_country.join(', ') : null,
      director: creators, // Para séries, usamos 'creators' ao invés de 'director'
      actors: actors || null,
      original_language: show.original_language || null,
      type: 'series'
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes da série no TMDB:', error.message);
    throw error;
  }
}

/**
 * Busca híbrida - Busca filmes E séries simultaneamente
 * @param {string} query - Título a buscar
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise<Array>} Lista combinada de filmes e séries
 */
async function searchMulti(query, language = 'pt-BR') {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: language,
        include_adult: false
      }
    });

    // Filtrar apenas filmes e séries (ignorar pessoas)
    const results = response.data.results
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => {
        if (item.media_type === 'movie') {
          return {
            tmdb_id: item.id,
            imdb_id: null,
            title: item.title,
            original_title: item.original_title,
            title_pt: item.title,
            year: item.release_date ? item.release_date.split('-')[0] : null,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            plot: item.overview || null,
            vote_average: item.vote_average || null,
            vote_count: item.vote_count || null,
            release_date: item.release_date || null,
            type: 'movie'
          };
        } else {
          // TV Show
          return {
            tmdb_id: item.id,
            imdb_id: null,
            title: item.name,
            original_title: item.original_name,
            title_pt: item.name,
            year: item.first_air_date ? item.first_air_date.split('-')[0] : null,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            plot: item.overview || null,
            vote_average: item.vote_average || null,
            vote_count: item.vote_count || null,
            first_air_date: item.first_air_date || null,
            type: 'series'
          };
        }
      });

    return results;
  } catch (error) {
    console.error('Erro ao buscar no TMDB (multi):', error.message);
    throw error;
  }
}

/**
 * Busca filmes por título (suporta português e outros idiomas)
 * @param {string} query - Título do filme (pode ser em português)
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise<Array>} Lista de filmes encontrados
 */
async function searchMovie(query, language = 'pt-BR') {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: language,
        include_adult: false
      }
    });

    return response.data.results.map(movie => ({
      tmdb_id: movie.id,
      imdb_id: null, // Será buscado depois se necessário
      title: movie.title,
      original_title: movie.original_title,
      title_pt: movie.title, // Título em português (se language=pt-BR)
      year: movie.release_date ? movie.release_date.split('-')[0] : null,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      plot: movie.overview || null,
      vote_average: movie.vote_average || null,
      vote_count: movie.vote_count || null,
      release_date: movie.release_date || null,
      type: 'movie' // Identifica como filme
    }));
  } catch (error) {
    console.error('Erro ao buscar filme no TMDB:', error.message);
    throw error;
  }
}

/**
 * Obtém detalhes completos de um filme por TMDB ID
 * Inclui: créditos (atores, diretores), países, etc
 * @param {number} tmdbId - ID do filme no TMDB
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise<Object>} Detalhes completos do filme
 */
async function getMovieDetails(tmdbId, language = 'pt-BR') {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: language,
        append_to_response: 'credits,external_ids'
      }
    });

    const movie = response.data;
    const credits = movie.credits || {};
    const cast = credits.cast || [];
    const crew = credits.crew || [];
    
    // Pega o diretor
    const director = crew.find(person => person.job === 'Director');
    
    // Pega os primeiros 5 atores
    const actors = cast.slice(0, 5).map(actor => actor.name).join(', ');

    return {
      tmdb_id: movie.id,
      imdb_id: movie.external_ids?.imdb_id || null,
      title: movie.title,
      original_title: movie.original_title,
      title_pt: movie.title, // Título traduzido se language=pt-BR
      year: movie.release_date ? movie.release_date.split('-')[0] : null,
      release_date: movie.release_date || null,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
      plot: movie.overview || null,
      genres: movie.genres ? movie.genres.map(g => g.name).join(', ') : null,
      runtime: movie.runtime ? `${movie.runtime} min` : null,
      vote_average: movie.vote_average || null,
      vote_count: movie.vote_count || null,
      country: movie.production_countries ? movie.production_countries.map(c => c.name).join(', ') : null,
      director: director ? director.name : null,
      actors: actors || null,
      original_language: movie.original_language || null
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do filme no TMDB:', error.message);
    throw error;
  }
}

/**
 * Busca pessoas (atores/diretores) por nome
 * @param {string} query - Nome da pessoa
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise<Array>} Lista de pessoas encontradas
 */
async function searchPerson(query, language = 'pt-BR') {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/person`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: language,
        include_adult: false
      }
    });

    return response.data.results.map(person => ({
      tmdb_person_id: person.id,
      name: person.name,
      profile_path: person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null,
      known_for_department: person.known_for_department || null,
      known_for: person.known_for ? person.known_for.map(movie => movie.title || movie.name).join(', ') : null
    }));
  } catch (error) {
    console.error('Erro ao buscar pessoa no TMDB:', error.message);
    throw error;
  }
}

/**
 * Obtém filmes de uma pessoa (ator ou diretor)
 * @param {number} personId - ID da pessoa no TMDB
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise<Object>} Lista de filmes como ator e como diretor
 */
async function getPersonMovieCredits(personId, language = 'pt-BR') {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      throw new Error('TMDB_API_KEY não configurada');
    }

    const response = await axios.get(`${TMDB_BASE_URL}/person/${personId}/movie_credits`, {
      params: {
        api_key: TMDB_API_KEY,
        language: language
      }
    });

    const cast = response.data.cast || [];
    const crew = response.data.crew || [];

    // Filtra apenas direções
    const directed = crew.filter(movie => movie.job === 'Director');

    return {
      as_actor: cast.map(movie => ({
        tmdb_id: movie.id,
        title: movie.title,
        title_pt: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : null,
        character: movie.character || null,
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : null
      })),
      as_director: directed.map(movie => ({
        tmdb_id: movie.id,
        title: movie.title,
        title_pt: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : null,
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : null
      }))
    };
  } catch (error) {
    console.error('Erro ao buscar créditos da pessoa no TMDB:', error.message);
    throw error;
  }
}

module.exports = {
  searchMovie,
  searchTvShow,
  searchMulti,
  getMovieDetails,
  getTvShowDetails,
  searchPerson,
  getPersonMovieCredits
};
