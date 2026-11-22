import React from 'react';
import { ShieldCheck, User, Eye } from 'lucide-react';

const RoleBadge = ({ role, size = 'sm' }) => {
  const normalizedRole = (role || 'user').toLowerCase();

  if (normalizedRole === 'admin') {
    return (
      <span className="badge badge-admin" title="Admin - Full system access">
        <ShieldCheck size={13} />
        Admin
      </span>
    );
  }

  if (normalizedRole === 'read-only') {
    return (
      <span className="badge badge-readonly" title="Read-Only - View permissions only">
        <Eye size={13} />
        Read-Only
      </span>
    );
  }

  return (
    <span className="badge badge-user" title="Standard User - Manage own data">
      <User size={13} />
      User
    </span>
  );
};

export default RoleBadge;
