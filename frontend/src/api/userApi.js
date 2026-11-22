import api from './client';

export const userApi = {
  getAllUsers: async () => {
    const res = await api.get('/users');
    return res.data;
  },

  updateRole: async (id, role) => {
    const res = await api.put(`/users/${id}/role`, { role });
    return res.data;
  },

  deleteUser: async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
};
