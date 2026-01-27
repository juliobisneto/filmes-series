const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Serviço para integração com TMDB API
 * Funcionalidades:
 * - Busca de filmes em português
 * - Busca de pessoas (atores/diretores)
 * - Obter detalhes completos de filmes
 */

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
      release_date: movie.release_date || null
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
  getMovieDetails,
  searchPerson,
  getPersonMovieCredits
};
