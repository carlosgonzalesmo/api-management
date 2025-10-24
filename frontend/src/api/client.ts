import { ENV } from '../env';
import {
  Endpoint,
  EndpointParameter,
  Schedule,
  Execution,
  CreateEndpointPayload,
  UpdateEndpointPayload,
  CreateParameterPayload,
  CreateSchedulePayload,
  ExecuteEndpointPayload,
} from './types';

// Helper genérico para requests
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ENV.VITE_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ENV.VITE_API_KEY,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} - ${text}`);
  }
  // Puede haber respuestas sin body (DELETE). Asumimos JSON si hay contenido.
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return undefined as unknown as T;
}

export const api = {
  // Endpoints CRUD
  listEndpoints: (): Promise<Endpoint[]> => request('/endpoints'),
  getEndpoint: (id: string): Promise<Endpoint> => request(`/endpoints/${id}`),
  createEndpoint: (payload: CreateEndpointPayload): Promise<Endpoint> =>
    request('/endpoints', { method: 'POST', body: JSON.stringify(payload) }),
  updateEndpoint: (id: string, payload: UpdateEndpointPayload): Promise<Endpoint> =>
    request(`/endpoints/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteEndpoint: (id: string): Promise<void> => request(`/endpoints/${id}`, { method: 'DELETE' }),

  // Parámetros
  listParameters: (endpointId: string): Promise<EndpointParameter[]> =>
    request(`/endpoints/${endpointId}/parameters`),
  createParameter: (endpointId: string, payload: CreateParameterPayload): Promise<EndpointParameter> =>
    request(`/endpoints/${endpointId}/parameters`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteParameter: (paramId: string): Promise<void> => request(`/parameters/${paramId}`, { method: 'DELETE' }),

  // Schedules
  listSchedules: (endpointId: string): Promise<Schedule[]> =>
    request(`/endpoints/${endpointId}/schedules`),
  createSchedule: (endpointId: string, payload: CreateSchedulePayload): Promise<Schedule> =>
    request(`/endpoints/${endpointId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateSchedule: (scheduleId: string, payload: Partial<CreateSchedulePayload>): Promise<Schedule> =>
    request(`/schedules/${scheduleId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteSchedule: (scheduleId: string): Promise<void> =>
    request(`/schedules/${scheduleId}`, { method: 'DELETE' }),

  // Ejecutar endpoint manualmente
  executeEndpoint: (endpointId: string, payload: ExecuteEndpointPayload): Promise<Execution> =>
    request(`/endpoints/${endpointId}/execute`, { method: 'POST', body: JSON.stringify(payload) }),
  listExecutions: (endpointId: string, limit = 20): Promise<Execution[]> =>
    request(`/endpoints/${endpointId}/executions?limit=${limit}`),
};
