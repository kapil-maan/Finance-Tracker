import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import RoleBadge from '../components/common/RoleBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Users, Shield, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const AdminUsersPage = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await userApi.getAllUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load user roster');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setUpdatingId(userId);
      setError(null);
      setSuccessMsg(null);
      const res = await userApi.updateRole(userId, newRole);
      if (res.success) {
        setSuccessMsg(res.message);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to delete user account "${email}"? This will delete all their transactions.`)) {
      return;
    }

    try {
      setError(null);
      setSuccessMsg(null);
      const res = await userApi.deleteUser(userId);
      if (res.success) {
        setSuccessMsg(`User ${email} deleted successfully`);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="page-container">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              User & Access Control Management
            </h2>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                color: '#8b5cf6',
                padding: '0.125rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              ADMIN ONLY
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Assign roles (admin, user, read-only) and govern tenant accounts and privileges
          </p>
        </div>

        <button onClick={fetchUsers} className="btn btn-secondary">
          <RefreshCw size={15} />
          <span>Refresh Users</span>
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success-text)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

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
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner text="Loading user directory..." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Current Role</th>
                  <th>Transactions</th>
                  <th>Total Income</th>
                  <th>Total Expenses</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'center' }}>Role Modification</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentAdmin?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <RoleBadge role={u.role} />
                      </td>
                      <td style={{ fontWeight: 600 }}>{u.transaction_count || 0}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                        +${parseFloat(u.total_income || 0).toFixed(2)}
                      </td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                        -${parseFloat(u.total_expense || 0).toFixed(2)}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <select
                          disabled={isSelf || updatingId === u.id}
                          className="form-select"
                          style={{
                            width: 'auto',
                            padding: '0.375rem 0.625rem',
                            fontSize: '0.8125rem',
                            display: 'inline-block',
                          }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="admin">admin</option>
                          <option value="user">user</option>
                          <option value="read-only">read-only</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          disabled={isSelf}
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            color: isSelf ? undefined : 'var(--danger)',
                            opacity: isSelf ? 0.3 : 1,
                            padding: '0.375rem',
                          }}
                          title={isSelf ? 'Cannot delete logged in account' : 'Delete user'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
