import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionApi } from '../api/transactionApi';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionFormModal from '../components/transactions/TransactionFormModal';
import DeleteConfirmModal from '../components/transactions/DeleteConfirmModal';
import VirtualList from '../components/common/VirtualList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Table as TableIcon,
  AlertCircle,
  Eye,
} from 'lucide-react';

const TransactionsPage = () => {
  const { isReadOnly, isAdmin } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'table' vs 'virtual' (fulfills virtual scrolling requirement)
  const [viewMode, setViewMode] = useState('table');

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
    sortBy: 'date',
    sortOrder: 'DESC',
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Categories (Cached for 1 hour in Redis)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await transactionApi.getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.warn('Failed to load categories:', err.message);
      }
    };
    loadCategories();
  }, []);

  // Fetch Transactions with useCallback
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await transactionApi.getTransactions(filters);
      if (res.success) {
        setTransactions(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset Filters
  const handleResetFilters = useCallback(() => {
    setFilters({
      search: '',
      type: '',
      categoryId: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
      sortBy: 'date',
      sortOrder: 'DESC',
    });
  }, []);

  // Pagination Handler
  const handlePageChange = useCallback((newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Modal Triggers
  const handleOpenAddModal = useCallback(() => {
    if (isReadOnly) return;
    setEditingTransaction(null);
    setIsFormOpen(true);
  }, [isReadOnly]);

  const handleOpenEditModal = useCallback((tx) => {
    if (isReadOnly) return;
    setEditingTransaction(tx);
    setIsFormOpen(true);
  }, [isReadOnly]);

  const handleOpenDeleteModal = useCallback((tx) => {
    if (isReadOnly) return;
    setTransactionToDelete(tx);
    setIsDeleteOpen(true);
  }, [isReadOnly]);

  // Form Submit Handler
  const handleSaveTransaction = useCallback(
    async (formData) => {
      if (editingTransaction) {
        await transactionApi.updateTransaction(editingTransaction.id, formData);
      } else {
        await transactionApi.createTransaction(formData);
      }
      await fetchTransactions();
    },
    [editingTransaction, fetchTransactions]
  );

  // Delete Confirm Handler
  const handleConfirmDelete = useCallback(
    async (id) => {
      try {
        setIsDeleting(true);
        await transactionApi.deleteTransaction(id);
        setIsDeleteOpen(false);
        setTransactionToDelete(null);
        await fetchTransactions();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete transaction');
      } finally {
        setIsDeleting(false);
      }
    },
    [fetchTransactions]
  );

  // useMemo implementation: memoize summary calculations of displayed page
  const pageTotals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return {
      income: income.toFixed(2),
      expense: expense.toFixed(2),
      net: (income - expense).toFixed(2),
    };
  }, [transactions]);

  return (
    <div className="page-container">
      {/* Header */}
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
            Transaction Management
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isReadOnly
              ? 'Read-Only Mode: Viewing transaction audit records without modification access'
              : 'Record, filter, categorize, and balance your financial income and expenditures'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View mode toggle: Table vs Virtual Scroll */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.25rem',
            }}
          >
            <button
              onClick={() => setViewMode('table')}
              className="btn btn-sm"
              style={{
                backgroundColor: viewMode === 'table' ? 'var(--primary-light)' : 'transparent',
                color: viewMode === 'table' ? 'var(--primary-text)' : 'var(--text-muted)',
                padding: '0.375rem 0.625rem',
                borderRadius: '6px',
              }}
              title="Standard Paginated Table"
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('virtual')}
              className="btn btn-sm"
              style={{
                backgroundColor: viewMode === 'virtual' ? 'var(--primary-light)' : 'transparent',
                color: viewMode === 'virtual' ? 'var(--primary-text)' : 'var(--text-muted)',
                padding: '0.375rem 0.625rem',
                borderRadius: '6px',
              }}
              title="Virtual Scrolling (High Performance rendering)"
            >
              <Layers size={14} />
              <span>Virtual Scroll</span>
            </button>
          </div>

          {/* Conditional rendering: Add Transaction button disabled/badge for read-only */}
          {isReadOnly ? (
            <button
              disabled
              className="btn btn-secondary"
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              title="Action disabled in Read-Only mode"
            >
              <Eye size={16} />
              <span>Read-Only Mode</span>
            </button>
          ) : (
            <button onClick={handleOpenAddModal} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Transaction</span>
            </button>
          )}
        </div>
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

      {/* Filters Bar */}
      <TransactionFilters
        filters={filters}
        categories={categories}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Summary of current query */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          Showing <strong>{transactions.length}</strong> of <strong>{pagination.total}</strong> matching records
        </span>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <span>Page Income: <strong style={{ color: 'var(--success)' }}>+${pageTotals.income}</strong></span>
          <span>Page Expense: <strong style={{ color: 'var(--danger)' }}>-${pageTotals.expense}</strong></span>
          <span>Net: <strong>${pageTotals.net}</strong></span>
        </div>
      </div>

      {/* Main Content: Table or Virtualized List */}
      {isLoading ? (
        <LoadingSpinner text="Fetching transactions from database..." />
      ) : transactions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            No transactions found
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Try altering your search filters or click "Add Transaction" to create a new entry.
          </p>
        </div>
      ) : viewMode === 'virtual' ? (
        /* Virtual Scrolling implementation for high performance rendering */
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-card-hover)',
              border: '1px solid var(--border)',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              display: 'grid',
              gridTemplateColumns: '100px 140px 1fr 100px 110px 90px',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <span>TYPE</span>
            <span>CATEGORY</span>
            <span>DESCRIPTION</span>
            <span>DATE</span>
            <span style={{ textAlign: 'right' }}>AMOUNT</span>
            <span style={{ textAlign: 'center' }}>ACTIONS</span>
          </div>

          <VirtualList
            items={transactions}
            itemHeight={56}
            containerHeight={460}
            renderItem={(tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  style={{
                    height: '56px',
                    display: 'grid',
                    gridTemplateColumns: '100px 140px 1fr 100px 110px 90px',
                    gap: '0.75rem',
                    alignItems: 'center',
                    padding: '0 1rem',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.8125rem',
                    backgroundColor: 'var(--bg-card)',
                  }}
                >
                  <div>
                    <span className={`badge ${isIncome ? 'badge-income' : 'badge-expense'}`}>
                      {isIncome ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                      {tx.type}
                    </span>
                  </div>
                  <div>
                    <span
                      style={{
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
                  </div>
                  <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tx.date}</div>
                  <div
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: isIncome ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {isIncome ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
                    <button
                      disabled={isReadOnly}
                      onClick={() => handleOpenEditModal(tx)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.25rem', opacity: isReadOnly ? 0.4 : 1 }}
                      title={isReadOnly ? 'Disabled in read-only' : 'Edit'}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      disabled={isReadOnly}
                      onClick={() => handleOpenDeleteModal(tx)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.25rem', opacity: isReadOnly ? 0.4 : 1, color: isReadOnly ? undefined : 'var(--danger)' }}
                      title={isReadOnly ? 'Disabled in read-only' : 'Delete'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            }}
          />
        </div>
      ) : (
        /* Standard Paginated Table View */
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Date</th>
                  {isAdmin && <th>User</th>}
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
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
                      {isAdmin && (
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {tx.user_name || tx.user_email || `User #${tx.user_id}`}
                        </td>
                      )}
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isIncome ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {isIncome ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                          <button
                            disabled={isReadOnly}
                            onClick={() => handleOpenEditModal(tx)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.375rem', opacity: isReadOnly ? 0.4 : 1 }}
                            title={isReadOnly ? 'Disabled in read-only mode' : 'Edit transaction'}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            disabled={isReadOnly}
                            onClick={() => handleOpenDeleteModal(tx)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '0.375rem',
                              opacity: isReadOnly ? 0.4 : 1,
                              color: isReadOnly ? undefined : 'var(--danger)',
                            }}
                            title={isReadOnly ? 'Disabled in read-only mode' : 'Delete transaction'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="btn btn-secondary btn-sm"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Add/Edit Modal */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveTransaction}
        categories={categories}
        transactionToEdit={editingTransaction}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        transaction={transactionToDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default TransactionsPage;
