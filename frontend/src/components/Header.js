import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Header.css';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isAdmin = () => {
    return user?.email === 'julio.bisneto@gmail.com';
  };

  const loadPendingRequests = useCallback(async () => {
    try {
      const response = await api.get('/friends/requests');
      const receivedCount = response.data.data.received.length;
      setPendingRequestsCount(receivedCount);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
      setPendingRequestsCount(0);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPendingRequests();
      // Atualizar a cada 30 segundos
      const interval = setInterval(loadPendingRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadPendingRequests]);

  // Não mostrar header nas páginas de login/registro
  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="header-logo" onClick={closeMenu}>
          <span>🎬</span>
          <h1>Filmes & Séries</h1>
        </Link>

        <button className="menu-toggle" onClick={toggleMenu}>
          {menuOpen ? '✕' : '☰'}
        </button>

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={isActive('/')} onClick={closeMenu}>
            Início
          </Link>
          <Link to="/dashboard" className={isActive('/dashboard')} onClick={closeMenu}>
            Dashboard
          </Link>
          <Link to="/add" className={isActive('/add')} onClick={closeMenu}>
            Adicionar
          </Link>
          <Link to="/friends" className={isActive('/friends')} onClick={closeMenu}>
            👥 Amigos
            {pendingRequestsCount > 0 && (
              <span className="notification-badge">{pendingRequestsCount}</span>
            )}
          </Link>
          {isAdmin() && (
            <Link to="/admin" className={`${isActive('/admin')} admin-link`} onClick={closeMenu}>
              🔐 Admin
            </Link>
          )}
          <Link to="/profile" className={isActive('/profile')} onClick={closeMenu}>
            <span className="user-avatar">{getInitials(user?.name)}</span>
            Perfil
          </Link>
          <button className="btn-logout" onClick={handleLogout}>
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
