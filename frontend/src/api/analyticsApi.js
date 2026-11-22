import api from './client';

export const analyticsApi = {
  getAnalytics: async (params = {}) => {
    const res = await api.get('/analytics', { params });
    return res.data;
  },

  purgeCache: async () => {
    const res = await api.post('/analytics/cache/purge');
    return res.data;
  },
};
