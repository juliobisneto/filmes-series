import React, { useState, useEffect } from 'react';
import './Filters.css';

function Filters({ onFilter, onClear }) {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    genre: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilter = () => {
    onFilter(filters);
  };

  const handleClear = () => {
    const clearedFilters = {
      search: '',
      status: '',
      type: '',
      genre: ''
    };
    setFilters(clearedFilters);
    onClear();
  };

  // Aplicar filtro automaticamente quando digitar na busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search || filters.status || filters.type || filters.genre) {
        handleFilter();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  return (
    <div className="filters">
      <h2 className="filters-title">
        <span>🔍</span> Filtros
      </h2>
      
      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="search">Buscar</label>
          <input
            type="text"
            id="search"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Digite o título..."
          />
        </div>

        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleChange}
          >
            <option value="">Todos</option>
            <option value="quero_ver">Quero Ver</option>
            <option value="assistindo">Assistindo</option>
            <option value="ja_vi">Já Vi</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="type">Tipo</label>
          <select
            id="type"
            name="type"
            value={filters.type}
            onChange={handleChange}
          >
            <option value="">Todos</option>
            <option value="movie">Filmes</option>
            <option value="series">Séries</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="genre">Gênero</label>
          <input
            type="text"
            id="genre"
            name="genre"
            value={filters.genre}
            onChange={handleChange}
            placeholder="Ex: Ação, Drama..."
          />
        </div>

        <div className="filter-actions">
          <button className="btn-clear" onClick={handleClear}>
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Filters;
