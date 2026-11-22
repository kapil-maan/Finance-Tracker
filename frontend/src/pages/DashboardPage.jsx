import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsApi } from '../api/analyticsApi';
import MetricCards from '../components/analytics/MetricCards';
import CategoryPieChart from '../components/analytics/CategoryPieChart';
import MonthlyTrendLineChart from '../components/analytics/MonthlyTrendLineChart';
import IncomeExpenseBarChart from '../components/analytics/IncomeExpenseBarChart';
import CacheBenchmarkCard from '../components/analytics/CacheBenchmarkCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, Shield, AlertCircle } from 'lucide-react';

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // useCallback implementation: optimize data fetching
  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await analyticsApi.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading && !analytics) {
    return <LoadingSpinner text="Computing financial analytics & querying cache..." />;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Financial Overview & Analytics
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isAdmin
              ? 'Administrator View: System-wide aggregated financial intelligence'
              : `Welcome back, ${user?.name || 'User'}! Here is your cash flow health.`}
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="btn btn-secondary"
          style={{ gap: '0.5rem' }}
        >
          <RefreshCw size={15} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger-text)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Redis Caching Benchmark Bar */}
      <CacheBenchmarkCard cache={analytics?.cache} onRefresh={fetchAnalytics} />

      {/* Summary KPI Cards */}
      <MetricCards summary={analytics?.summary} cache={analytics?.cache} />

      {/* Charts Grid: Pie, Line, Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <CategoryPieChart categoryBreakdown={analytics?.categoryBreakdown || []} />
        <MonthlyTrendLineChart monthlyTrends={analytics?.monthlyTrends || []} />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <IncomeExpenseBarChart monthlyTrends={analytics?.monthlyTrends || []} />
      </div>

      {/* Recent Transactions List */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Recent Activity
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Latest 5 entries
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.recentTransactions && analytics.recentTransactions.length > 0 ? (
                analytics.recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}>
                          {isIncome ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                          {tx.type}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: tx.category_color ? `${tx.category_color}22` : 'var(--bg-app)',
                            color: tx.category_color || 'var(--text-primary)',
                          }}
                        >
                          {tx.category_name || 'General'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{tx.description}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{tx.date}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isIncome ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {isIncome ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No recent transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
