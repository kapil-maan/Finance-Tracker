import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Wallet,
  ShieldCheck,
  User,
  Eye,
  Sun,
  Moon,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Quick Demo Login for interviewers & evaluators
  const handleQuickDemo = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    try {
      setIsLoading(true);
      setError(null);
      await login(demoEmail, 'Password123!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        backgroundColor: 'var(--bg-app)',
        position: 'relative',
      }}
    >
      {/* Theme toggle in top right */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
        <button onClick={toggleTheme} className="btn btn-secondary btn-sm" style={{ padding: '0.5rem' }}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* App Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 18px rgba(79, 70, 229, 0.35)',
              marginBottom: '1rem',
            }}
          >
            <Wallet size={26} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Welcome to FinanceTracker
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Full-stack financial analytics with Redis caching & RBAC
          </p>
        </div>

        {/* Demo Roles Quick Access Box */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-card-hover)',
            border: '1px dashed var(--border-focus)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-text)' }}>
            <Sparkles size={14} />
            <span>1-Click Demo Credentials (Pre-seeded RBAC Roles)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin@financetracker.com')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.25rem' }}
              title="Admin role: full privileges and user management"
            >
              <ShieldCheck size={14} color="#8b5cf6" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('user@financetracker.com')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.25rem' }}
              title="Standard user: CRUD on own transactions"
            >
              <User size={14} color="#10b981" />
              <span>User</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('readonly@financetracker.com')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.25rem' }}
              title="Read-only: view-only permissions"
            >
              <Eye size={14} color="#f59e0b" />
              <span>Read-Only</span>
            </button>
          </div>
        </div>

        {/* Login Card */}
        <div className="card">
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger-text)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div
            style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border)',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
            }}
          >
            Don't have an account yet?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
