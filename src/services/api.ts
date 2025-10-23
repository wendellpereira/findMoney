const API_BASE_URL = '/api';

class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(errorData.error || 'Request failed', response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0);
  }
};

export const transactionsApi = {
  getAll: (category?: string | null) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiRequest(`/transactions${params}`);
  },
  
  getById: (id: string) => apiRequest(`/transactions/${id}`),
  
  create: (transaction: any) => apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  }),
  
  update: (id: string, transaction: any) => apiRequest(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transaction),
  }),
  
  delete: (id: string) => apiRequest(`/transactions/${id}`, {
    method: 'DELETE',
  }),
  
  bulkUpdateCategory: (merchant: string, category: string) => apiRequest('/transactions/category/bulk', {
    method: 'PUT',
    body: JSON.stringify({ merchant, category }),
  }),
};

export const statementsApi = {
  getAll: () => apiRequest('/statements'),

  create: (statement: any) => apiRequest('/statements', {
    method: 'POST',
    body: JSON.stringify(statement),
  }),

  delete: (id: number) => apiRequest(`/statements/${id}`, {
    method: 'DELETE',
  }),
};

export const healthApi = {
  check: () => apiRequest('/health'),
};

export { ApiError };
