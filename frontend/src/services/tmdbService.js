import api from './api';

/**
 * Serviço para integração com TMDB via backend
 */

/**
 * Busca filmes por título (suporta português!)
 * @param {string} query - Título do filme
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise} Resultados da busca
 */
export const searchMovie = async (query, language = 'pt-BR') => {
  try {
    const response = await api.get('/tmdb/search/movie', {
      params: { query, language }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar filme no TMDB:', error);
    throw error;
  }
};

/**
 * Obtém detalhes completos de um filme
 * @param {number} tmdbId - ID do filme no TMDB
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise} Detalhes do filme
 */
export const getMovieDetails = async (tmdbId, language = 'pt-BR') => {
  try {
    const response = await api.get(`/tmdb/movie/${tmdbId}`, {
      params: { language }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar detalhes do filme no TMDB:', error);
    throw error;
  }
};

/**
 * Busca pessoas (atores/diretores) por nome
 * @param {string} query - Nome da pessoa
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise} Resultados da busca
 */
export const searchPerson = async (query, language = 'pt-BR') => {
  try {
    const response = await api.get('/tmdb/search/person', {
      params: { query, language }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pessoa no TMDB:', error);
    throw error;
  }
};

/**
 * Obtém filmes de uma pessoa (ator ou diretor)
 * @param {number} personId - ID da pessoa no TMDB
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise} Créditos da pessoa
 */
export const getPersonMovieCredits = async (personId, language = 'pt-BR') => {
  try {
    const response = await api.get(`/tmdb/person/${personId}/movies`, {
      params: { language }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar créditos da pessoa no TMDB:', error);
    throw error;
  }
};

/**
 * Busca híbrida - TMDB + OMDb
 * @param {string} query - Título do filme
 * @param {string} language - Idioma (padrão: pt-BR)
 * @returns {Promise} Resultados enriquecidos
 */
export const searchHybrid = async (query, language = 'pt-BR') => {
  try {
    const response = await api.get('/tmdb/search/hybrid', {
      params: { query, language }
    });
    return response.data;
  } catch (error) {
    console.error('Erro na busca híbrida:', error);
    throw error;
  }
};

const tmdbService = {
  searchMovie,
  getMovieDetails,
  searchPerson,
  getPersonMovieCredits,
  searchHybrid
};

export default tmdbService;
