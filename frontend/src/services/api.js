import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Response interceptor to extract data or normalize error messages
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let errorMessage = 'An unexpected network error occurred';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      const data = error.response.data;
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage = data.error;
      }
    } else if (error.request) {
      errorMessage = 'Could not connect to BlockWatch backend server. Please verify backend is running on port 5000.';
      statusCode = 503;
    } else {
      errorMessage = error.message;
    }

    const customError = new Error(errorMessage);
    customError.statusCode = statusCode;
    customError.details = error.response?.data?.details || null;
    return Promise.reject(customError);
  }
);

export const api = {
  // System Health
  getHealth: () => apiClient.get('/health'),

  // Wallets APIs
  getWallets: (params = {}) => apiClient.get('/wallets', { params }),
  getWalletById: (id) => apiClient.get(`/wallets/${id}`),
  registerWallet: (payload) => apiClient.post('/wallets', payload),
  updateWalletStatus: (id, isActive) => apiClient.patch(`/wallets/${id}/status`, { isActive }),
  deleteWallet: (id) => apiClient.delete(`/wallets/${id}`),

  // Monitoring APIs
  getWalletInfo: (address, network) => apiClient.get(`/monitoring/wallet/${address}`, {
    params: network ? { network } : {}
  }),
  getWalletBalance: (address, network) => apiClient.get(`/monitoring/wallet/${address}/balance`, {
    params: network ? { network } : {}
  }),
  getWalletTransactions: (address, params = {}) => apiClient.get(`/monitoring/wallet/${address}/transactions`, { params }),
  getAllTransactions: (params = {}) => apiClient.get('/monitoring/transactions', { params }),
  getMonitoredTransaction: (txid, network) => apiClient.get(`/monitoring/transactions/${txid}`, {
    params: network ? { network } : {}
  }),
  triggerSync: () => apiClient.post('/monitoring/sync'),

  // Blockchain APIs
  getBlockchainStatus: (network) => apiClient.get('/blockchain/status', {
    params: network ? { network } : {}
  }),
  getBlockchainTransaction: (txid, network) => apiClient.get(`/blockchain/transactions/${txid}`, {
    params: network ? { network } : {}
  })
};

export default api;
