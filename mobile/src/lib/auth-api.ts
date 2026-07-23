import { mainApi } from './api';
import { setAccessToken, setRefreshToken, setStoredUser } from './auth-storage';

export type AuthUser = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  profile?: {
    phone?: string;
    status?: string;
  };
};

type LoginResponse = {
  status: 'success' | 'fail';
  message: string | string[];
  userData?: AuthUser;
  access?: string;
  refresh?: string;
};

type RegisterResponse = {
  status: 'success' | 'fail';
  message: string | string[];
  userData?: AuthUser;
};

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await mainApi.post<LoginResponse>('/api/auth/login/', { email, password });
  if (data.status !== 'success') {
    const msg = Array.isArray(data.message) ? data.message.join(' ') : data.message;
    throw new Error(msg || 'Sign in failed');
  }
  if (!data.access || !data.refresh) {
    throw new Error(
      'Sign-in is temporarily unavailable — the server needs an update to issue mobile tokens. Please try again later.',
    );
  }
  if (!data.userData) {
    throw new Error('Sign-in response is missing your account data. Try again.');
  }
  await setAccessToken(data.access);
  await setRefreshToken(data.refresh);
  await setStoredUser(data.userData);
  return data.userData;
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}): Promise<AuthUser> {
  const { data } = await mainApi.post<RegisterResponse>('/api/auth/register/', {
    email: input.email,
    password: input.password,
    first_name: input.firstName,
    last_name: input.lastName ?? '',
    phone: input.phone,
    role: 'tenant',
  });
  if (data.status !== 'success' || !data.userData) {
    const msg = Array.isArray(data.message) ? data.message.join(' ') : data.message;
    throw new Error(msg || 'Sign up failed');
  }
  return login(input.email, input.password);
}
