import axios, { AxiosError } from 'axios';
import { config } from './config';
import { clearTokens, getAccessToken } from './auth-storage';

export const gatewayApi = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
});

export const mainApi = axios.create({
  baseURL: config.mainServiceBaseUrl,
  timeout: 30000,
});

for (const client of [gatewayApi, mainApi]) {
  client.interceptors.request.use(async (req) => {
    const token = await getAccessToken();
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        await clearTokens();
      }
      return Promise.reject(error);
    },
  );
}
