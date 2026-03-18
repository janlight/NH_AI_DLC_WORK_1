import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor: 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const customerToken = localStorage.getItem('table_auth_token');
  const adminToken = localStorage.getItem('admin_auth_token');
  const token = adminToken || customerToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: 401 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const event = new CustomEvent('auth:unauthorized');
      window.dispatchEvent(event);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
