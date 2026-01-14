import { useAuthStore } from '@/stores/authStore';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchAPI(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { accessToken, logout } = useAuthStore.getState();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Adicionar token se disponível
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Se token inválido/expirado, fazer logout e redirecionar
  if (response.status === 401) {
    // Clonar response para poder ler o body sem consumir o stream original
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();
    if (
      data.error === 'Token inválido ou expirado' ||
      data.error === 'Token inválido' ||
      data.error === 'Token não fornecido'
    ) {
      logout();
      window.location.href = '/login?expired=true';
      throw new ApiError('Sessão expirada', 401, data);
    }
  }

  return response;
}

export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await fetchAPI(url, { method: 'GET' });
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || 'Erro na requisição', response.status, data);
  }

  return data;
}

export async function apiPost<T = any>(url: string, body?: any): Promise<T> {
  const response = await fetchAPI(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || 'Erro na requisição', response.status, data);
  }

  return data;
}

export async function apiPatch<T = any>(url: string, body?: any): Promise<T> {
  const response = await fetchAPI(url, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || 'Erro na requisição', response.status, data);
  }

  return data;
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await fetchAPI(url, { method: 'DELETE' });
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || 'Erro na requisição', response.status, data);
  }

  return data;
}
