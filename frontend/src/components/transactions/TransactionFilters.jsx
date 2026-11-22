import React, { useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';

const TransactionFilters = ({
  filters,
  categories = [],
  onFilterChange,
  onReset,
}) => {
  // useCallback implementation: optimize filter event handlers
  const handleInputChange = useCallback(
    (field, value) => {
      onFilterChange((prev) => ({
        ...prev,
        [field]: value,
        page: 1, // Reset to first page on filter alteration
      }));
    },
    [onFilterChange]
  );

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Search & Filter Transactions
          </span>
        </div>
        <button
          onClick={onReset}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
        >
          <X size={13} />
          Reset Filters
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
        }}
      >
        {/* Search by text */}
        <div>
          <label className="form-label">Search Description</label>
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="e.g. Grocery, Salary..."
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
            />
          </div>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="form-label">Transaction Type</label>
          <select
            className="form-select"
            value={filters.type || ''}
            onChange={(e) => handleInputChange('type', e.target.value)}
          >
            <option value="">All Types (Income & Expense)</option>
            <option value="income">Income Only</option>
            <option value="expense">Expense Only</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={filters.categoryId || ''}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="form-label">From Date</label>
          <input
            type="date"
            className="form-input"
            value={filters.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
          >
          </input>
        </div>

        {/* End Date */}
        <div>
          <label className="form-label">To Date</label>
          <input
            type="date"
            className="form-input"
            value={filters.endDate || ''}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
          >
          </input>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
