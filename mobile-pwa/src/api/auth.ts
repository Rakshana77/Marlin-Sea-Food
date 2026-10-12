import { apiClient, setStoredToken } from './client';
import { AuthSuccessData, LoginPayload } from '../types/api';
import { User } from '../types/models';

export async function loginApi(payload: LoginPayload): Promise<AuthSuccessData> {
  const data = await apiClient<AuthSuccessData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data?.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function fetchCurrentProfile(): Promise<User> {
  return await apiClient<User>('/auth/me', {
    method: 'GET',
  });
}

export function logoutUser(): void {
  setStoredToken(null);
}
