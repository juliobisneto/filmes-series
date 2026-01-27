const express = require('express');
const router = express.Router();
const tmdbService = require('../services/tmdbService');

/**
 * Rota: Buscar filmes por título (suporta português!)
 * GET /api/tmdb/search/movie?query=De Volta Para o Futuro
 * GET /api/tmdb/search/movie?query=Back to the Future&language=en-US
 */
router.get('/search/movie', async (req, res) => {
  try {
    const { query, language } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'O parâmetro "query" é obrigatório'
      });
    }

    const results = await tmdbService.searchMovie(query, language || 'pt-BR');

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Erro na busca de filmes TMDB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar filmes no TMDB',
      error: error.message
    });
  }
});

/**
 * Rota: Obter detalhes completos de um filme por TMDB ID
 * GET /api/tmdb/movie/:tmdbId
 * GET /api/tmdb/movie/:tmdbId?language=en-US
 */
router.get('/movie/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const { language } = req.query;

    const movieDetails = await tmdbService.getMovieDetails(tmdbId, language || 'pt-BR');

    res.json({
      success: true,
      data: movieDetails
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do filme TMDB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes do filme no TMDB',
      error: error.message
    });
  }
});

/**
 * Rota: Buscar pessoas (atores/diretores) por nome
 * GET /api/tmdb/search/person?query=Tom Hanks
 * GET /api/tmdb/search/person?query=Steven Spielberg
 */
router.get('/search/person', async (req, res) => {
  try {
    const { query, language } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'O parâmetro "query" é obrigatório'
      });
    }

    const results = await tmdbService.searchPerson(query, language || 'pt-BR');

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Erro na busca de pessoas TMDB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pessoas no TMDB',
      error: error.message
    });
  }
});

/**
 * Rota: Obter filmes de uma pessoa (como ator ou diretor)
 * GET /api/tmdb/person/:personId/movies
 */
router.get('/person/:personId/movies', async (req, res) => {
  try {
    const { personId } = req.params;
    const { language } = req.query;

    const credits = await tmdbService.getPersonMovieCredits(personId, language || 'pt-BR');

    res.json({
      success: true,
      data: credits
    });
  } catch (error) {
    console.error('Erro ao buscar créditos da pessoa TMDB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar créditos da pessoa no TMDB',
      error: error.message
    });
  }
});

/**
 * Rota: Busca híbrida - Busca no TMDB e enriquece com OMDb
 * GET /api/tmdb/search/hybrid?query=De Volta Para o Futuro
 * 
 * Retorna resultados do TMDB com informações adicionais do OMDb quando disponível
 */
router.get('/search/hybrid', async (req, res) => {
  try {
    const { query, language } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'O parâmetro "query" é obrigatório'
      });
    }

    // 1. Busca no TMDB (aceita português)
    const tmdbResults = await tmdbService.searchMovie(query, language || 'pt-BR');

    // 2. Para os primeiros resultados, tenta enriquecer com OMDb
    const enrichedResults = await Promise.all(
      tmdbResults.slice(0, 5).map(async (movie) => {
        try {
          // Se tem tmdb_id, pega os detalhes completos (inclui imdb_id)
          const details = await tmdbService.getMovieDetails(movie.tmdb_id, language || 'pt-BR');
          return { ...movie, ...details };
        } catch (error) {
          // Se falhar, retorna o resultado básico do TMDB
          return movie;
        }
      })
    );

    // Adiciona os demais resultados sem enriquecimento
    const allResults = [...enrichedResults, ...tmdbResults.slice(5)];

    res.json({
      success: true,
      count: allResults.length,
      data: allResults,
      source: 'TMDB (híbrido com detalhes completos)'
    });
  } catch (error) {
    console.error('Erro na busca híbrida TMDB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro na busca híbrida',
      error: error.message
    });
  }
});

module.exports = router;
