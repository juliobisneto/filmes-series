import React from 'react';
import './ChartPie.css';

function ChartPie({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-empty">Sem dados para exibir</div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    '#667eea',
    '#f093fb',
    '#4facfe',
    '#43e97b',
    '#fa709a',
    '#30cfd0',
    '#a8edea',
    '#fed6e3'
  ];

  let currentAngle = 0;
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage: percentage.toFixed(1),
      angle,
      startAngle,
      color: colors[index % colors.length]
    };
  });

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-pie-container">
        <div className="chart-pie">
          <svg viewBox="0 0 100 100" className="chart-pie-svg">
            {segments.map((segment, index) => {
              const radius = 40;
              const centerX = 50;
              const centerY = 50;
              
              const startAngleRad = (segment.startAngle - 90) * (Math.PI / 180);
              const endAngleRad = (segment.startAngle + segment.angle - 90) * (Math.PI / 180);
              
              const x1 = centerX + radius * Math.cos(startAngleRad);
              const y1 = centerY + radius * Math.sin(startAngleRad);
              const x2 = centerX + radius * Math.cos(endAngleRad);
              const y2 = centerY + radius * Math.sin(endAngleRad);
              
              const largeArc = segment.angle > 180 ? 1 : 0;
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={segment.color}
                  className="chart-pie-segment"
                />
              );
            })}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
          <div className="chart-pie-center">
            <div className="chart-pie-total">{total}</div>
            <div className="chart-pie-label">Total</div>
          </div>
        </div>
        
        <div className="chart-pie-legend">
          {segments.map((segment, index) => (
            <div key={index} className="chart-pie-legend-item">
              <div 
                className="chart-pie-legend-color"
                style={{ background: segment.color }}
              />
              <div className="chart-pie-legend-label">
                <span className="chart-pie-legend-name">{segment.label}</span>
                <span className="chart-pie-legend-value">
                  {segment.value} ({segment.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChartPie;
