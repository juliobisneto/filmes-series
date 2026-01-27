import React, { useState, useEffect, useCallback } from 'react';
import { mediaService } from '../services/api';
import { Loading, ErrorMessage } from '../components/Loading';
import StatCard from '../components/StatCard';
import ChartBar from '../components/ChartBar';
import ChartPie from '../components/ChartPie';
import './DashboardPage.css';

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await mediaService.getAll();
      const mediaData = response.data;
      calculateStats(mediaData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar estatísticas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateStats = (mediaData) => {
    // Estatísticas gerais
    const totalItems = mediaData.length;
    const totalMovies = mediaData.filter(m => m.type === 'movie').length;
    const totalSeries = mediaData.filter(m => m.type === 'series').length;
    
    // Por status
    const queroVer = mediaData.filter(m => m.status === 'quero_ver').length;
    const assistindo = mediaData.filter(m => m.status === 'assistindo').length;
    const jaVi = mediaData.filter(m => m.status === 'ja_vi').length;

    // Avaliações
    const rated = mediaData.filter(m => m.rating && m.rating > 0);
    const avgRating = rated.length > 0 
      ? (rated.reduce((sum, m) => sum + m.rating, 0) / rated.length).toFixed(1)
      : 0;

    // Por ano (normalizar removendo caracteres especiais)
    const byYear = {};
    mediaData.forEach(m => {
      if (m.year) {
        // Extrair apenas os 4 dígitos do ano, ignorando qualquer caractere extra
        const yearMatch = m.year.toString().match(/(\d{4})/);
        if (yearMatch) {
          const year = yearMatch[1];
          byYear[year] = (byYear[year] || 0) + 1;
        }
      }
    });
    const yearData = Object.entries(byYear)
      .map(([year, count]) => ({ label: year, value: count }))
      .sort((a, b) => b.label.localeCompare(a.label))
      .slice(0, 10);

    // Por gênero
    const byGenre = {};
    mediaData.forEach(m => {
      if (m.genre) {
        const genres = m.genre.split(',').map(g => g.trim());
        genres.forEach(genre => {
          if (genre) {
            byGenre[genre] = (byGenre[genre] || 0) + 1;
          }
        });
      }
    });
    const genreData = Object.entries(byGenre)
      .map(([genre, count]) => ({ label: genre, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Por avaliação
    const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    mediaData.forEach(m => {
      if (m.rating && m.rating > 0) {
        byRating[m.rating]++;
      }
    });
    const ratingData = Object.entries(byRating)
      .map(([rating, count]) => ({ 
        label: `${'★'.repeat(parseInt(rating))}${'☆'.repeat(5 - parseInt(rating))}`, 
        value: count 
      }))
      .reverse();

    // Por status (para gráfico de pizza)
    const statusData = [
      { label: 'Quero Ver', value: queroVer },
      { label: 'Assistindo', value: assistindo },
      { label: 'Já Vi', value: jaVi }
    ].filter(item => item.value > 0);

    // Por tipo (para gráfico de pizza)
    const typeData = [
      { label: 'Filmes', value: totalMovies },
      { label: 'Séries', value: totalSeries }
    ].filter(item => item.value > 0);

    // Tempo total estimado (apenas filmes com runtime)
    const totalMinutes = mediaData
      .filter(m => m.runtime)
      .reduce((sum, m) => {
        const match = m.runtime.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0);
    const totalHours = Math.floor(totalMinutes / 60);

    // Por país (separar países compostos como "USA, UK")
    const byCountry = {};
    mediaData.forEach(m => {
      if (m.country) {
        const countries = m.country.split(',').map(c => c.trim());
        countries.forEach(country => {
          if (country) {
            byCountry[country] = (byCountry[country] || 0) + 1;
          }
        });
      }
    });
    const countryData = Object.entries(byCountry)
      .map(([country, count]) => ({ label: country, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    setStats({
      totalItems,
      totalMovies,
      totalSeries,
      queroVer,
      assistindo,
      jaVi,
      avgRating,
      totalHours,
      yearData,
      genreData,
      ratingData,
      statusData,
      typeData,
      countryData
    });
  };

  if (loading) {
    return (
      <div className="dashboard-page container">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page container">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!stats || stats.totalItems === 0) {
    return (
      <div className="dashboard-page container">
        <div className="dashboard-header">
          <h1>📊 Dashboard</h1>
          <p>Suas estatísticas de filmes e séries</p>
        </div>
        <div className="dashboard-empty">
          <span className="dashboard-empty-icon">🎬</span>
          <h2>Nenhum filme ou série cadastrado</h2>
          <p>Comece adicionando seus filmes favoritos!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page container">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <p>Suas estatísticas de filmes e séries</p>
      </div>

      {/* Cards de estatísticas gerais */}
      <div className="dashboard-stats-grid">
        <StatCard 
          icon="🎬"
          title="Total"
          value={stats.totalItems}
          subtitle={`${stats.totalMovies} filmes • ${stats.totalSeries} séries`}
          color="blue"
        />
        <StatCard 
          icon="⭐"
          title="Avaliação Média"
          value={stats.avgRating}
          subtitle="Sua nota média"
          color="orange"
        />
        <StatCard 
          icon="⏱️"
          title="Tempo Total"
          value={`${stats.totalHours}h`}
          subtitle="Tempo de runtime"
          color="purple"
        />
        <StatCard 
          icon="✅"
          title="Já Assistidos"
          value={stats.jaVi}
          subtitle={`${((stats.jaVi / stats.totalItems) * 100).toFixed(0)}% concluído`}
          color="green"
        />
      </div>

      {/* Gráficos de Pizza */}
      <div className="dashboard-charts-row">
        <ChartPie 
          data={stats.typeData}
          title="📺 Filmes vs Séries"
        />
        <ChartPie 
          data={stats.statusData}
          title="📋 Por Status"
        />
      </div>

      {/* Gráficos de Barras */}
      <div className="dashboard-charts-col">
        <ChartBar 
          data={stats.yearData}
          title="📅 Top 10 Anos"
          color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
        
        <ChartBar 
          data={stats.genreData}
          title="🎭 Top Gêneros"
          color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        />
        
        <ChartBar 
          data={stats.countryData}
          title="🌍 Top 10 Países"
          color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        />
        
        <ChartBar 
          data={stats.ratingData}
          title="⭐ Distribuição por Avaliação"
          color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        />
      </div>
    </div>
  );
}

export default DashboardPage;
