import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PieChart as PieIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

const CategoryPieChart = ({ categoryBreakdown = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = useMemo(() => {
    if (!categoryBreakdown || categoryBreakdown.length === 0) {
      return {
        labels: ['No Expenses Recorded'],
        datasets: [
          {
            data: [1],
            backgroundColor: [isDark ? '#1e293b' : '#e2e8f0'],
            borderWidth: 0,
          },
        ],
      };
    }

    const labels = categoryBreakdown.map((item) => item.category);
    const data = categoryBreakdown.map((item) => item.total);
    const backgroundColors = categoryBreakdown.map((item) => item.color || '#6366f1');

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: isDark ? '#111827' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [categoryBreakdown, isDark]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: isDark ? '#cbd5e1' : '#475569',
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 12,
            weight: 500,
          },
          boxWidth: 12,
          boxHeight: 12,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#475569',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return ` $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '68%',
  };

  return (
    <div className="card" style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PieIcon size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Expense Distribution by Category
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {categoryBreakdown.length} Categories
        </span>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default CategoryPieChart;
