import React, { useState, useEffect } from 'react';
import './Filters.css';

function Filters({ onFilter, onClear }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    title: '',
    director: '',
    actors: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClear = () => {
    const clearedFilters = {
      title: '',
      director: '',
      actors: ''
    };
    setFilters(clearedFilters);
    onClear();
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      // Ao colapsar, limpa os filtros
      handleClear();
    }
  };

  const hasActiveFilters = filters.title || filters.director || filters.actors;

  // Aplicar filtro automaticamente quando digitar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasActiveFilters) {
        onFilter(filters);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, onFilter, hasActiveFilters]);

  return (
    <div className={`filters ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button className="filters-toggle" onClick={toggleExpand}>
        <span className="toggle-icon">{isExpanded ? '🔽' : '🔍'}</span>
        <span className="toggle-text">
          {isExpanded ? 'Ocultar busca' : 'Busca na sua biblioteca'}
        </span>
        {hasActiveFilters && !isExpanded && (
          <span className="active-indicator">●</span>
        )}
      </button>
      
      {isExpanded && (
        <div className="filters-content">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="title">
                <span className="label-icon">🎬</span>
                Título
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={filters.title}
                onChange={handleChange}
                placeholder="Nome do filme ou série..."
                autoFocus
              />
            </div>

            <div className="filter-group">
              <label htmlFor="director">
                <span className="label-icon">🎥</span>
                Diretor/Diretora
              </label>
              <input
                type="text"
                id="director"
                name="director"
                value={filters.director}
                onChange={handleChange}
                placeholder="Nome do diretor(a)..."
              />
            </div>

            <div className="filter-group">
              <label htmlFor="actors">
                <span className="label-icon">🎭</span>
                Atores/Atrizes
              </label>
              <input
                type="text"
                id="actors"
                name="actors"
                value={filters.actors}
                onChange={handleChange}
                placeholder="Nome do ator ou atriz..."
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="filter-actions">
              <button className="btn-clear" onClick={handleClear}>
                ✕ Limpar busca
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Filters;
