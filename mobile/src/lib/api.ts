import axios, { AxiosError } from 'axios';
import { config } from './config';
import { clearToken, getToken } from './auth-storage';

export const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
});

api.interceptors.request.use(async (req) => {
  const token = await getToken();
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await clearToken();
    }
    return Promise.reject(error);
  },
);
