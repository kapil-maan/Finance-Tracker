import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Percent, Zap } from 'lucide-react';

const MetricCards = ({ summary = {}, cache = {} }) => {
  // useMemo implementation: Optimize expensive calculations like totals, averages, and ratios
  const metrics = useMemo(() => {
    const totalIncome = summary.totalIncome || 0;
    const totalExpense = summary.totalExpense || 0;
    const netSavings = summary.netSavings || (totalIncome - totalExpense);
    const savingsRate = summary.savingsRate || (totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0);
    const totalTransactions = summary.totalTransactions || 0;

    const avgTransaction = totalTransactions > 0 ? (totalExpense / Math.max(1, totalTransactions)).toFixed(2) : '0.00';

    return {
      totalIncome: totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalExpense: totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      netSavings: netSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      isPositiveSavings: netSavings >= 0,
      savingsRate: `${savingsRate}%`,
      avgTransaction: `$${avgTransaction}`,
      totalTransactions,
    };
  }, [summary]);

  const cards = [
    {
      title: 'Total Income',
      value: `$${metrics.totalIncome}`,
      subtitle: `${metrics.totalTransactions} recorded entries`,
      icon: TrendingUp,
      color: '#10b981',
      bgColor: 'var(--success-light)',
      textColor: 'var(--success-text)',
    },
    {
      title: 'Total Expenses',
      value: `$${metrics.totalExpense}`,
      subtitle: `Avg $${metrics.avgTransaction} per entry`,
      icon: TrendingDown,
      color: '#ef4444',
      bgColor: 'var(--danger-light)',
      textColor: 'var(--danger-text)',
    },
    {
      title: 'Net Savings',
      value: `$${metrics.netSavings}`,
      subtitle: metrics.isPositiveSavings ? 'Positive cash flow' : 'Deficit spending',
      icon: PiggyBank,
      color: metrics.isPositiveSavings ? '#6366f1' : '#f59e0b',
      bgColor: metrics.isPositiveSavings ? 'var(--primary-light)' : 'var(--warning-light)',
      textColor: metrics.isPositiveSavings ? 'var(--primary-text)' : 'var(--warning-text)',
    },
    {
      title: 'Savings Rate',
      value: metrics.savingsRate,
      subtitle: 'Target: ≥ 20.0%',
      icon: Percent,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      textColor: '#8b5cf6',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.5rem',
      }}
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {card.title}
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: card.bgColor,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={18} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {card.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricCards;
