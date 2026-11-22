import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  Users,
  FileCode2,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

const Sidebar = () => {
  const { role, isAdmin } = useAuth();

  const navLinks = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: '/transactions',
      label: 'Transactions',
      icon: Receipt,
    },
    ...(isAdmin
      ? [
          {
            to: '/admin/users',
            label: 'User Management',
            icon: Users,
            badge: 'Admin',
          },
        ]
      : []),
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem 1rem',
        flexShrink: 0,
      }}
    >
      <div>
        <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Menu Navigation
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary-text)' : 'var(--text-secondary)',
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Icon size={18} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      color: '#8b5cf6',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Swagger API Docs Link */}
        <a
          href="http://localhost:5000/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.625rem 0.875rem',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          <FileCode2 size={16} color="var(--primary)" />
          <span>Swagger API Docs</span>
        </a>

        {/* System Tech Stack Card */}
        <div
          style={{
            padding: '0.875rem',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border)',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <Layers size={14} color="var(--primary)" />
            <span>Architecture</span>
          </div>
          <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
            PostgreSQL 18 + Redis Caching + Express RBAC
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
