const express = require('express');
const router = express.Router();
const axios = require('axios');

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const OMDB_BASE_URL = 'http://www.omdbapi.com/';

// Função auxiliar para limpar o ano (remover hífens e caracteres extras)
const cleanYear = (yearString) => {
  if (!yearString) return null;
  const match = yearString.match(/\d{4}/); // Extrai apenas os 4 dígitos do ano
  return match ? match[0] : yearString;
};

// Middleware para verificar se a API key está configurada
const checkApiKey = (req, res, next) => {
  if (!OMDB_API_KEY || OMDB_API_KEY === 'your_api_key_here') {
    return res.status(500).json({ 
      error: 'OMDb API key não configurada. Configure a variável OMDB_API_KEY no arquivo .env' 
    });
  }
  next();
};

// GET - Buscar filmes/séries no IMDB por título
router.get('/search', checkApiKey, async (req, res) => {
  try {
    const { title, type, year } = req.query;

    if (!title) {
      return res.status(400).json({ error: 'Parâmetro title é obrigatório' });
    }

    const params = {
      apikey: OMDB_API_KEY,
      s: title
    };

    if (type) {
      params.type = type; // movie ou series
    }

    if (year) {
      params.y = year;
    }

    // Buscar primeira página (10 resultados)
    const page1Response = await axios.get(OMDB_BASE_URL, { 
      params: { ...params, page: 1 } 
    });

    if (page1Response.data.Response === 'False') {
      return res.status(404).json({ 
        error: page1Response.data.Error || 'Nenhum resultado encontrado' 
      });
    }

    let allResults = page1Response.data.Search || [];
    const totalResults = parseInt(page1Response.data.totalResults) || 0;

    // Se houver mais de 10 resultados, buscar segunda página
    if (totalResults > 10) {
      try {
        const page2Response = await axios.get(OMDB_BASE_URL, { 
          params: { ...params, page: 2 } 
        });
        
        if (page2Response.data.Response === 'True' && page2Response.data.Search) {
          allResults = [...allResults, ...page2Response.data.Search];
        }
      } catch (error) {
        console.error('Erro ao buscar página 2:', error.message);
        // Continua com os resultados da página 1
      }
    }

    res.json({
      results: allResults,
      totalResults: totalResults
    });
  } catch (error) {
    console.error('Erro ao buscar no OMDb:', error.message);
    res.status(500).json({ error: 'Erro ao buscar no IMDB' });
  }
});

// GET - Obter detalhes completos de um filme/série por IMDB ID
router.get('/:imdbId', checkApiKey, async (req, res) => {
  try {
    const { imdbId } = req.params;

    if (!imdbId) {
      return res.status(400).json({ error: 'IMDB ID é obrigatório' });
    }

    const params = {
      apikey: OMDB_API_KEY,
      i: imdbId,
      plot: 'full' // Sinopse completa
    };

    const response = await axios.get(OMDB_BASE_URL, { params });

    if (response.data.Response === 'False') {
      return res.status(404).json({ 
        error: response.data.Error || 'Filme/Série não encontrado' 
      });
    }

    // Formatar os dados para o formato do nosso sistema
    const formattedData = {
      title: response.data.Title,
      type: response.data.Type === 'movie' ? 'movie' : 'series',
      genre: response.data.Genre,
      imdb_id: response.data.imdbID,
      imdb_rating: response.data.imdbRating,
      poster_url: response.data.Poster !== 'N/A' ? response.data.Poster : null,
      plot: response.data.Plot !== 'N/A' ? response.data.Plot : null,
      year: cleanYear(response.data.Year),
      director: response.data.Director !== 'N/A' ? response.data.Director : null,
      actors: response.data.Actors !== 'N/A' ? response.data.Actors : null,
      runtime: response.data.Runtime !== 'N/A' ? response.data.Runtime : null,
      // Dados extras que podem ser úteis
      country: response.data.Country,
      language: response.data.Language,
      awards: response.data.Awards,
      metascore: response.data.Metascore,
      imdb_votes: response.data.imdbVotes,
      rated: response.data.Rated
    };

    res.json(formattedData);
  } catch (error) {
    console.error('Erro ao buscar detalhes no OMDb:', error.message);
    res.status(500).json({ error: 'Erro ao buscar detalhes no IMDB' });
  }
});

// GET - Buscar por título específico (retorna apenas um resultado mais preciso)
router.get('/title/:title', checkApiKey, async (req, res) => {
  try {
    const { title } = req.params;
    const { year, type } = req.query;

    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    const params = {
      apikey: OMDB_API_KEY,
      t: title,
      plot: 'full'
    };

    if (year) {
      params.y = year;
    }

    if (type) {
      params.type = type;
    }

    const response = await axios.get(OMDB_BASE_URL, { params });

    if (response.data.Response === 'False') {
      return res.status(404).json({ 
        error: response.data.Error || 'Filme/Série não encontrado' 
      });
    }

    // Formatar os dados
    const formattedData = {
      title: response.data.Title,
      type: response.data.Type === 'movie' ? 'movie' : 'series',
      genre: response.data.Genre,
      imdb_id: response.data.imdbID,
      imdb_rating: response.data.imdbRating,
      poster_url: response.data.Poster !== 'N/A' ? response.data.Poster : null,
      plot: response.data.Plot !== 'N/A' ? response.data.Plot : null,
      year: cleanYear(response.data.Year),
      director: response.data.Director !== 'N/A' ? response.data.Director : null,
      actors: response.data.Actors !== 'N/A' ? response.data.Actors : null,
      runtime: response.data.Runtime !== 'N/A' ? response.data.Runtime : null,
      country: response.data.Country !== 'N/A' ? response.data.Country : null
    };

    res.json(formattedData);
  } catch (error) {
    console.error('Erro ao buscar título no OMDb:', error.message);
    res.status(500).json({ error: 'Erro ao buscar no IMDB' });
  }
});

module.exports = router;
