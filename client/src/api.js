const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function api(path, method = 'GET', body) {
  const isFormData = body instanceof FormData;

  const headers = {
    ...(localStorage.token
      ? { Authorization: 'Bearer ' + localStorage.token }
      : {})
  };

  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const normalizedPath = path.startsWith('/') ? path : '/' + path;

  const response = await fetch(API_BASE_URL + '/api' + normalizedPath, {
    method,
    headers,
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && localStorage.token) {
    localStorage.clear();
    window.location.reload();
  }

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}