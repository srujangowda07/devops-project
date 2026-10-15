const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function handleResponse(response) {
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorDetail =
      (typeof data === 'object' && data !== null && (data.detail || data.message)) ||
      (typeof data === 'string' && data) ||
      `HTTP error ${response.status}`;
    throw new Error(typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail);
  }
  return data;
}

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return handleResponse(res);
}

export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/api/resources/stats`);
  return handleResponse(res);
}

export async function fetchResources(filters = {}) {
  const params = new URLSearchParams();
  if (filters.provider && filters.provider !== 'ALL') {
    params.set('provider', filters.provider);
  }
  if (filters.status && filters.status !== 'ALL') {
    params.set('status', filters.status);
  }
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${BASE_URL}/api/resources${qs}`);
  return handleResponse(res);
}

export async function getResource(id) {
  const res = await fetch(`${BASE_URL}/api/resources/${id}`);
  return handleResponse(res);
}

export async function createResource(data) {
  const res = await fetch(`${BASE_URL}/api/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateResource(id, data) {
  const res = await fetch(`${BASE_URL}/api/resources/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteResource(id) {
  const res = await fetch(`${BASE_URL}/api/resources/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

export async function fetchIncidents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.resourceId) {
    params.set('resource_id', filters.resourceId);
  }
  if (filters.status && filters.status !== 'ALL') {
    params.set('status', filters.status);
  }
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${BASE_URL}/api/incidents${qs}`);
  return handleResponse(res);
}

export async function createIncident(data) {
  const res = await fetch(`${BASE_URL}/api/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateIncident(id, data) {
  const res = await fetch(`${BASE_URL}/api/incidents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteIncident(id) {
  const res = await fetch(`${BASE_URL}/api/incidents/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}
