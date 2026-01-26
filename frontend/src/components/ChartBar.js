import React from 'react';
import './ChartBar.css';

function ChartBar({ data, title, color = '#667eea' }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-empty">Sem dados para exibir</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-bar">
        {data.map((item, index) => (
          <div key={index} className="chart-bar-item">
            <div className="chart-bar-label">{item.label}</div>
            <div className="chart-bar-wrapper">
              <div 
                className="chart-bar-fill"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  background: color
                }}
              >
                <span className="chart-bar-value">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChartBar;
