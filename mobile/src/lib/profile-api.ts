import { mainApi } from './api';
import { setStoredUser } from './auth-storage';
import type { AuthUser } from './auth-api';

type UpdateResponse = {
  status: 'success' | 'error';
  message: string;
  data?: AuthUser;
};

export async function updateProfile(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<AuthUser> {
  const { data } = await mainApi.patch<UpdateResponse>('/api/auth/profile/update/', {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
  });
  if (data.status !== 'success' || !data.data) {
    throw new Error(data.message || 'Could not update profile');
  }
  await setStoredUser(data.data);
  return data.data;
}
