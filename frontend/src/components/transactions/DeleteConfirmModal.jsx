import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, transaction, isDeleting }) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Delete Transaction</h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.375rem' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Are you sure you want to permanently delete this transaction?
          </p>
          <div
            style={{
              padding: '0.875rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border)',
              fontSize: '0.8125rem',
            }}
          >
            <div><strong>Description:</strong> {transaction.description}</div>
            <div><strong>Amount:</strong> ${parseFloat(transaction.amount).toFixed(2)}</div>
            <div><strong>Date:</strong> {transaction.date}</div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onConfirm(transaction.id)}
            className="btn btn-danger"
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
