import api from './api';

export const getTalentPool = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      query.append(key, value);
    }
  });
  const response = await api.get(`/talent-pool?${query.toString()}`);
  return response.data;
};

export const getTalentPoolEntry = async (id) => {
  const response = await api.get(`/talent-pool/${id}`);
  return response.data;
};

export const addToTalentPool = async (candidateId) => {
  const response = await api.post('/talent-pool', { candidateId });
  return response.data;
};

export const updateTalentPoolEntry = async (id, data) => {
  const response = await api.put(`/talent-pool/${id}`, data);
  return response.data;
};

export const removeFromTalentPool = async (id) => {
  const response = await api.delete(`/talent-pool/${id}`);
  return response.data;
};

export const toggleFavorite = async (id) => {
  const response = await api.put(`/talent-pool/${id}/favorite`);
  return response.data;
};

export const toggleArchive = async (id) => {
  const response = await api.put(`/talent-pool/${id}/archive`);
  return response.data;
};

export const rateCandidate = async (id, rating) => {
  const response = await api.put(`/talent-pool/${id}/rate`, { rating });
  return response.data;
};

export const addNote = async (id, text) => {
  const response = await api.put(`/talent-pool/${id}/note`, { text });
  return response.data;
};

export const deleteNote = async (id, noteIndex) => {
  const response = await api.delete(`/talent-pool/${id}/note/${noteIndex}`);
  return response.data;
};

export const addTag = async (id, tags) => {
  const response = await api.put(`/talent-pool/${id}/tag`, { tags });
  return response.data;
};

export const inviteCandidate = async (candidateId, jobId, message = '') => {
  const response = await api.post('/talent-pool/invite', { candidateId, jobId, message });
  return response.data;
};

export const getCollections = async () => {
  const response = await api.get('/talent-pool/collections');
  return response.data;
};

export const createCollection = async (name, description = '') => {
  const response = await api.post('/talent-pool/collections', { name, description });
  return response.data;
};

export const updateCollection = async (id, data) => {
  const response = await api.put(`/talent-pool/collections/${id}`, data);
  return response.data;
};

export const deleteCollection = async (id) => {
  const response = await api.delete(`/talent-pool/collections/${id}`);
  return response.data;
};

export const exportTalentPool = async (candidateIds = [], format = 'csv') => {
  const response = await api.post('/talent-pool/export', { candidateIds, format }, { responseType: 'blob' });
  return response.data;
};

export const getTalentPoolStats = async () => {
  const response = await api.get('/talent-pool/stats');
  return response.data;
};

export const getRecruiterJobs = async () => {
  const response = await api.get('/recruiter/jobs?limit=100');
  return response.data;
};

export const startConversation = async (recipientId) => {
  const response = await api.post(`/messages/conversation/${recipientId}`);
  return response.data;
};
