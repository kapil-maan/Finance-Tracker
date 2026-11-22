import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Check, AlertCircle, ShieldAlert } from 'lucide-react';

const TransactionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  transactionToEdit = null,
}) => {
  const { isReadOnly } = useAuth();

  const [formData, setFormData] = useState({
    type: 'expense',
    category_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when editing
  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        type: transactionToEdit.type || 'expense',
        category_id: transactionToEdit.category_id || '',
        amount: transactionToEdit.amount || '',
        description: transactionToEdit.description || '',
        date: transactionToEdit.date || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        type: 'expense',
        category_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setError(null);
  }, [transactionToEdit, isOpen]);

  // Filter categories matching the current type
  const matchingCategories = useMemo(() => {
    return categories.filter((cat) => cat.type === formData.type);
  }, [categories, formData.type]);

  // Set default category when type toggles if current category doesn't match
  useEffect(() => {
    if (matchingCategories.length > 0 && !matchingCategories.some(c => c.id === parseInt(formData.category_id, 10))) {
      setFormData((prev) => ({ ...prev, category_id: matchingCategories[0].id }));
    }
  }, [formData.type, matchingCategories]);

  // useCallback implementation: optimize field change handler
  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // useCallback implementation: optimize form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isReadOnly) return; // Guard against read-only submission

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount greater than zero.');
        return;
      }
      if (!formData.description.trim()) {
        setError('Please provide a description.');
        return;
      }

      try {
        setIsSubmitting(true);
        setError(null);
        await onSubmit({
          ...formData,
          amount: parseFloat(formData.amount),
          category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        });
        onClose();
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to save transaction');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isReadOnly, onSubmit, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {transactionToEdit ? 'Edit Transaction' : 'Record New Transaction'}
          </h3>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.375rem', borderRadius: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {isReadOnly && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#f59e0b',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                <ShieldAlert size={16} />
                <span>Read-Only Role: You can view details, but mutation is disabled.</span>
              </div>
            )}

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
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Type selector: Income or Expense */}
            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => handleFieldChange('type', 'expense')}
                  style={{
                    padding: '0.625rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    border: '1px solid',
                    cursor: isReadOnly ? 'not-allowed' : 'pointer',
                    borderColor: formData.type === 'expense' ? 'var(--danger)' : 'var(--border)',
                    backgroundColor: formData.type === 'expense' ? 'var(--danger-light)' : 'transparent',
                    color: formData.type === 'expense' ? 'var(--danger-text)' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Expense
                </button>
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => handleFieldChange('type', 'income')}
                  style={{
                    padding: '0.625rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    border: '1px solid',
                    cursor: isReadOnly ? 'not-allowed' : 'pointer',
                    borderColor: formData.type === 'income' ? 'var(--success)' : 'var(--border)',
                    backgroundColor: formData.type === 'income' ? 'var(--success-light)' : 'transparent',
                    color: formData.type === 'income' ? 'var(--success-text)' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Income
                </button>
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                disabled={isReadOnly}
                className="form-select"
                value={formData.category_id}
                onChange={(e) => handleFieldChange('category_id', e.target.value)}
              >
                {matchingCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Amount ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                disabled={isReadOnly}
                placeholder="0.00"
                className="form-input"
                value={formData.amount}
                onChange={(e) => handleFieldChange('amount', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description / Note</label>
              <input
                type="text"
                disabled={isReadOnly}
                placeholder="e.g. Weekly Whole Foods groceries"
                className="form-input"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                required
              />
            </div>

            {/* Date */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Transaction Date</label>
              <input
                type="date"
                disabled={isReadOnly}
                className="form-input"
                value={formData.date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isReadOnly || isSubmitting}
              className="btn btn-primary"
            >
              <Check size={16} />
              <span>
                {isReadOnly
                  ? 'Disabled (Read-Only Role)'
                  : isSubmitting
                  ? 'Saving...'
                  : transactionToEdit
                  ? 'Update Transaction'
                  : 'Add Transaction'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionFormModal;
