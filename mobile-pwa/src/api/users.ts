import { apiClient } from './client';
import { User, Role } from '../types/models';
import { CreateUserPayload, UpdateUserPayload } from '../types/api';

export async function getUsers(search?: string): Promise<User[]> {
  return await apiClient<User[]>('/users', {
    method: 'GET',
    params: {
      search,
      limit: 100,
    },
  });
}

export async function getUserById(id: string): Promise<User> {
  return await apiClient<User>(`/users/${id}`, {
    method: 'GET',
  });
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  return await apiClient<User>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  return await apiClient<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string): Promise<User> {
  return await apiClient<User>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export async function getRoles(): Promise<Role[]> {
  return await apiClient<Role[]>('/roles', {
    method: 'GET',
  });
}
