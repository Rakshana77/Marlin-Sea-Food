import { apiClient } from './client';
import { Seafood, SeafoodCategory, SeafoodGrade } from '../types/models';

// --- Seafood Species Master ---
export async function getSeafoodList(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
} = {}): Promise<Seafood[]> {
  return await apiClient<Seafood[]>('/seafood', {
    method: 'GET',
    params: {
      ...params,
      page: params.page || 1,
      limit: params.limit || 100,
    },
  });
}

export async function createSeafood(payload: {
  name: string;
  categoryId: string;
  unit?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  description?: string | null;
}): Promise<Seafood> {
  return await apiClient<Seafood>('/seafood', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSeafood(id: string, payload: Partial<{
  name: string;
  categoryId: string;
  unit: string;
  status: 'ACTIVE' | 'INACTIVE';
  description: string | null;
}>): Promise<Seafood> {
  return await apiClient<Seafood>(`/seafood/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteSeafood(id: string): Promise<Seafood> {
  return await apiClient<Seafood>(`/seafood/${id}`, {
    method: 'DELETE',
  });
}

// --- Seafood Categories Master ---
export async function getCategories(activeOnly = false): Promise<SeafoodCategory[]> {
  return await apiClient<SeafoodCategory[]>('/seafood-categories', {
    method: 'GET',
    params: activeOnly ? { active: 'true' } : undefined,
  });
}

export async function createCategory(payload: {
  name: string;
  description?: string | null;
  active?: boolean;
}): Promise<SeafoodCategory> {
  return await apiClient<SeafoodCategory>('/seafood-categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(id: string, payload: Partial<{
  name: string;
  description: string | null;
  active: boolean;
}>): Promise<SeafoodCategory> {
  return await apiClient<SeafoodCategory>(`/seafood-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(id: string): Promise<SeafoodCategory> {
  return await apiClient<SeafoodCategory>(`/seafood-categories/${id}`, {
    method: 'DELETE',
  });
}

// --- Seafood Grades Master ---
export async function getGrades(activeOnly = false): Promise<SeafoodGrade[]> {
  return await apiClient<SeafoodGrade[]>('/seafood-grades', {
    method: 'GET',
    params: activeOnly ? { active: 'true' } : undefined,
  });
}

export async function createGrade(payload: {
  name: string;
  description?: string | null;
  active?: boolean;
}): Promise<SeafoodGrade> {
  return await apiClient<SeafoodGrade>('/seafood-grades', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateGrade(id: string, payload: Partial<{
  name: string;
  description: string | null;
  active: boolean;
}>): Promise<SeafoodGrade> {
  return await apiClient<SeafoodGrade>(`/seafood-grades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteGrade(id: string): Promise<SeafoodGrade> {
  return await apiClient<SeafoodGrade>(`/seafood-grades/${id}`, {
    method: 'DELETE',
  });
}
