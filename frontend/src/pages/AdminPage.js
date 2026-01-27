import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loading, ErrorMessage } from '../components/Loading';
import './AdminPage.css';

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Rolar para o topo
    window.scrollTo(0, 0);
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      
      if (err.response?.status === 403) {
        setError('Acesso negado. Esta área é restrita ao administrador.');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError('Erro ao carregar estatísticas de usuários');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="admin-page container">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page container">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="admin-page container">
      <div className="admin-header">
        <h1>🔐 Painel de Administração</h1>
        <p>Estatísticas gerais do sistema</p>
      </div>

      {/* Cards de resumo */}
      <div className="admin-summary">
        <div className="summary-card">
          <div className="summary-icon">👥</div>
          <div className="summary-content">
            <div className="summary-value">{stats.general.totalUsers}</div>
            <div className="summary-label">Usuários Cadastrados</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">🎬</div>
          <div className="summary-content">
            <div className="summary-value">{stats.general.totalMovies}</div>
            <div className="summary-label">Filmes Total</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <div className="summary-value">{stats.general.averageMoviesPerUser}</div>
            <div className="summary-label">Média por Usuário</div>
          </div>
        </div>

        {stats.general.topUser && (
          <div className="summary-card highlight">
            <div className="summary-icon">🏆</div>
            <div className="summary-content">
              <div className="summary-value">{stats.general.topUser.firstName}</div>
              <div className="summary-label">
                Usuário mais ativo ({stats.general.topUser.totalMovies} filmes)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de usuários */}
      <div className="admin-table-section">
        <h2>📋 Detalhamento por Usuário</h2>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Total de Filmes</th>
                <th>Membro Desde</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {stats.users.map((user, index) => (
                <tr key={user.id} className={user.isAdmin ? 'admin-row' : ''}>
                  <td>{index + 1}</td>
                  <td>
                    {user.firstName}
                    {user.isAdmin && <span className="admin-badge">ADMIN</span>}
                  </td>
                  <td>
                    <span className="movie-count">{user.totalMovies}</span>
                  </td>
                  <td>{formatDate(user.memberSince)}</td>
                  <td>
                    {user.totalMovies === 0 ? (
                      <span className="status-badge inactive">Inativo</span>
                    ) : user.totalMovies >= 20 ? (
                      <span className="status-badge active">Muito Ativo</span>
                    ) : user.totalMovies >= 5 ? (
                      <span className="status-badge moderate">Ativo</span>
                    ) : (
                      <span className="status-badge low">Pouco Ativo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botão voltar */}
      <div className="admin-actions">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Voltar para Home
        </button>
      </div>
    </div>
  );
}

export default AdminPage;
