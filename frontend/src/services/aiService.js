import api from '../services/api';

const AI_TIMEOUT = 30000;

export const sendMessage = async (message, signal) => {
  try {
    const { data } = await api.post('/ai/chat', { message }, { signal });
    return data;
  } catch (err) {
    if (err.name === 'CanceledError' || err.name === 'AbortError') {
      throw err;
    }
    if (!err.response) {
      throw new Error('Unable to reach the server. Please check your connection and try again.');
    }
    if (err.response.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    if (err.response.status >= 500) {
      throw new Error('The AI service is temporarily unavailable. Please try again later.');
    }
    throw err;
  }
};
