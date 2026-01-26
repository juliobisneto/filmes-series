import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
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
