import React from 'react';
import './Loading.css';

export function Loading() {
  return (
    <div className="loading">
      <span>⏳</span>
      <p>Carregando...</p>
    </div>
  );
}

export function ErrorMessage({ message }) {
  return (
    <div className="error-message">
      <span>⚠️</span>
      <p>{message || 'Ocorreu um erro. Tente novamente.'}</p>
    </div>
  );
}

export function EmptyMessage({ message }) {
  return (
    <div className="empty-message">
      <span>📭</span>
      <p>{message || 'Nenhum item encontrado.'}</p>
    </div>
  );
}
