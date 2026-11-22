import React, { useState } from 'react';
import { Zap, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { analyticsApi } from '../../api/analyticsApi';

const CacheBenchmarkCard = ({ cache = {}, onRefresh }) => {
  const [isPurging, setIsPurging] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isHit = cache?.status === 'HIT';
  const responseTime = cache?.responseTime || 'N/A';
  const provider = cache?.provider || 'Redis / Memory-TTL';
  const ttl = cache?.ttlSeconds ? `${cache.ttlSeconds / 60} minutes` : '15 minutes';

  const handlePurge = async () => {
    try {
      setIsPurging(true);
      await analyticsApi.purgeCache();
      setFeedback('Cache purged! Fetching fresh data from PostgreSQL database...');
      setTimeout(() => {
        if (onRefresh) onRefresh();
        setFeedback(null);
        setIsPurging(false);
      }, 600);
    } catch (err) {
      setFeedback('Notice: User role restricted from administrative cache purge.');
      setIsPurging(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div
      className="card"
      style={{
        background: isHit
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)'
          : 'var(--bg-card)',
        border: isHit ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
        marginBottom: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: isHit ? 'var(--success-light)' : 'var(--warning-light)',
              color: isHit ? 'var(--success)' : 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Redis Caching Performance Audit
              </h4>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: isHit ? 'var(--success-light)' : 'var(--warning-light)',
                  color: isHit ? 'var(--success-text)' : 'var(--warning-text)',
                  border: `1px solid ${isHit ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                }}
              >
                Cache {isHit ? 'HIT (Instant)' : 'MISS (DB Query)'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              Provider: <strong style={{ color: 'var(--text-secondary)' }}>{provider}</strong> &nbsp;|&nbsp;
              TTL Policy: <strong style={{ color: 'var(--text-secondary)' }}>{ttl}</strong> &nbsp;|&nbsp;
              Latency: <strong style={{ color: isHit ? 'var(--success)' : 'var(--warning)' }}>{responseTime}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {feedback && (
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>
              {feedback}
            </span>
          )}
          <button
            onClick={() => onRefresh && onRefresh()}
            className="btn btn-secondary btn-sm"
            title="Re-request endpoint (tests Cache HIT)"
          >
            <RefreshCw size={14} />
            <span>Verify Cache</span>
          </button>
          <button
            onClick={handlePurge}
            disabled={isPurging}
            className="btn btn-secondary btn-sm"
            title="Purge Redis cache to test Cache MISS -> Cache HIT cycle"
          >
            <Database size={14} />
            <span>{isPurging ? 'Purging...' : 'Purge Cache'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CacheBenchmarkCard;
