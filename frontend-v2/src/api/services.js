import api from './client';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getUsers: () => api.get('/auth/users'),
  updateUserRole: (id, role) => api.put(`/auth/users/${id}/role`, { role }),
};

export const jobsAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getOne: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

export const candidatesAPI = {
  getAll: (params) => api.get('/candidates', { params }),
  getOne: (id) => api.get(`/candidates/${id}`),
  uploadResume: (formData) =>
    api.post('/candidates/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  reparse: (id) => api.post(`/candidates/${id}/reparse`),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
  getDuplicates: () => api.get('/candidates/duplicates/list'),
  getSmartShortlist: (jobId) => api.get(`/candidates/shortlist/${jobId}`),
};

export const applicationsAPI = {
  getAll: (params) => api.get('/applications', { params }),
  getOne: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  updateStage: (id, data) => api.put(`/applications/${id}/stage`, data),
  addNote: (id, text) => api.post(`/applications/${id}/notes`, { text }),
  toggleShortlist: (id) => api.put(`/applications/${id}/shortlist`),
  rescore: (id) => api.post(`/applications/${id}/rescore`),
};

export const interviewsAPI = {
  getAll: (params) => api.get('/interviews', { params }),
  schedule: (data) => api.post('/interviews', data),
  update: (id, data) => api.put(`/interviews/${id}`, data),
  delete: (id) => api.delete(`/interviews/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const aiAPI = {
  parseResume: (resumeText) => api.post('/ai/parse-resume', { resumeText }),
  scoreCandidate: (data) => api.post('/ai/score-candidate', data),
  extractKeywords: (text) => api.post('/ai/extract-keywords', { text }),
  explain: (applicationId) => api.get(`/ai/explain/${applicationId}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};
