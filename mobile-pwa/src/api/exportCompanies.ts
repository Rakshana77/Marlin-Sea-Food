import { apiClient } from './client';
import { ExportCompany } from '../types/models';
import { CreateExportCompanyPayload, UpdateExportCompanyPayload } from '../types/api';

export async function getExportCompanies(search?: string, status?: 'ACTIVE' | 'INACTIVE'): Promise<ExportCompany[]> {
  return await apiClient<ExportCompany[]>('/export-companies', {
    method: 'GET',
    params: {
      search,
      status,
      limit: 100,
    },
  });
}

export async function getExportCompanyById(id: string): Promise<ExportCompany> {
  return await apiClient<ExportCompany>(`/export-companies/${id}`, {
    method: 'GET',
  });
}

export async function createExportCompany(payload: CreateExportCompanyPayload): Promise<ExportCompany> {
  return await apiClient<ExportCompany>('/export-companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateExportCompany(id: string, payload: UpdateExportCompanyPayload): Promise<ExportCompany> {
  return await apiClient<ExportCompany>(`/export-companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteExportCompany(id: string): Promise<ExportCompany> {
  return await apiClient<ExportCompany>(`/export-companies/${id}`, {
    method: 'DELETE',
  });
}
