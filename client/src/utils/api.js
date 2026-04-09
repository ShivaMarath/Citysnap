import axios from 'axios';

export const api = axios.create({
  baseURL: '${import.meta.env.VITE_API_URL}/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('citysnap_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
}

