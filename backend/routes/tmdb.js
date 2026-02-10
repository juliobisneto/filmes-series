const express = require('express');
const router = express.Router();
const tmdbService = require('../services/tmdbService');

/**
 * Rota: Buscar séries por título (suporta português!)
 * GET /api/tmdb/search/tv?query=Unfamiliar
 * GET /api/tmdb/search/tv?query=Breaking Bad&language=en-US
 */
router.get('/search/tv', async (req, res) => {
  try {
    const { query, language } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'O parâmetro "query" é obrigatório'
      });
    }

    const results = await tmdbService.searchTvShow(query, language || 'pt-BR');

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Erro na busca de séries TMDB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar séries no TMDB',
      error: error.message
    });
  }
});

/**
 * Rota: Buscar filmes E séries simultaneamente (busca multi)
 * GET /api/tmdb/search/multi?query=Unfamiliar
 * GET /api/tmdb/search/multi?query=Matrix&language=en-US
 */
router.get('/search/multi', async (req, res) => {
  try {
    const { query, language } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'O parâmetro "query" é obrigatório'
      });
    }

    const results = await tmdbService.searchMulti(query, language || 'pt-BR');

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Erro na busca multi TMDB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar no TMDB',
      error: error.message
    });
  }
});

/**
 * Rota: Obter detalhes completos de uma série por TMDB ID
 * GET /api/tmdb/tv/:tmdbId
 * GET /api/tmdb/tv/:tmdbId?language=en-US
 */
router.get('/tv/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const { language } = req.query;

    const showDetails = await tmdbService.getTvShowDetails(tmdbId, language || 'pt-BR');

    res.json({
      success: true,
      data: showDetails
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da série TMDB:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar detalhes da série no TMDB',
      error: error.message
    });
  }
});

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
 * Rota: Busca híbrida - Busca filmes E séries no TMDB com detalhes completos
 * GET /api/tmdb/search/hybrid?query=Unfamiliar
 * 
 * Retorna resultados do TMDB (filmes + séries) com detalhes enriquecidos
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

    // 1. Busca multi no TMDB (filmes + séries, aceita português)
    const tmdbResults = await tmdbService.searchMulti(query, language || 'pt-BR');

    // 2. Para os primeiros resultados, tenta enriquecer com detalhes completos
    const enrichedResults = await Promise.all(
      tmdbResults.slice(0, 5).map(async (item) => {
        try {
          // Se é filme, busca detalhes de filme
          if (item.type === 'movie') {
            const details = await tmdbService.getMovieDetails(item.tmdb_id, language || 'pt-BR');
            return { ...item, ...details };
          } else if (item.type === 'series') {
            // Se é série, busca detalhes de série
            const details = await tmdbService.getTvShowDetails(item.tmdb_id, language || 'pt-BR');
            return { ...item, ...details };
          }
          return item;
        } catch (error) {
          // Se falhar, retorna o resultado básico do TMDB
          return item;
        }
      })
    );

    // Adiciona os demais resultados sem enriquecimento
    const allResults = [...enrichedResults, ...tmdbResults.slice(5)];

    res.json({
      success: true,
      count: allResults.length,
      data: allResults,
      source: 'TMDB Multi (filmes + séries com detalhes completos)'
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
