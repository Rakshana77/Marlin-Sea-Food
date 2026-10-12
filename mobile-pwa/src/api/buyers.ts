import { apiClient } from './client';
import { Customer } from '../types/models';
import { CreateCustomerPayload } from '../types/api';

export async function getCustomers(search?: string, status?: 'ACTIVE' | 'INACTIVE'): Promise<Customer[]> {
  return await apiClient<Customer[]>('/customers', {
    method: 'GET',
    params: {
      search,
      status,
      limit: 100,
    },
  });
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<Customer> {
  return await apiClient<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      countryCode: payload.countryCode || '+91',
    }),
  });
}

export async function updateCustomer(id: string, payload: Partial<CreateCustomerPayload & { status: 'ACTIVE' | 'INACTIVE' }>): Promise<Customer> {
  return await apiClient<Customer>(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomer(id: string): Promise<Customer> {
  return await apiClient<Customer>(`/customers/${id}`, {
    method: 'DELETE',
  });
}

export async function getCustomerById(id: string): Promise<Customer> {
  return await apiClient<Customer>(`/customers/${id}`, {
    method: 'GET',
  });
}
