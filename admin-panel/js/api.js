const Auth = {
  getToken() {
    return localStorage.getItem('sks_admin_token');
  },
  getAdmin() {
    try {
      return JSON.parse(localStorage.getItem('sks_admin_profile') || 'null');
    } catch {
      return null;
    }
  },
  setSession(token, admin) {
    localStorage.setItem('sks_admin_token', token);
    localStorage.setItem('sks_admin_profile', JSON.stringify(admin));
  },
  clearSession() {
    localStorage.removeItem('sks_admin_token');
    localStorage.removeItem('sks_admin_profile');
  },
  requireAuth() {
    if (!this.getToken()) {
      window.location.href = 'index.html';
    }
  },
};

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = Auth.getToken();

  if (token) headers.Authorization = `Bearer ${token}`;

  const isFormData = options.body instanceof FormData;
  if (options.body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    Auth.clearSession();
    window.location.href = 'index.html';
    throw new Error('Session expired. Please log in again.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }

  return data;
}
