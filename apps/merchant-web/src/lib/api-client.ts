import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from './stores/auth-store';

// Extend AxiosInstance to include our custom methods
interface CustomAxiosInstance extends AxiosInstance {
  clearCache: () => Promise<void>;
}

export interface ApiError {
  error: string;
  message?: string;
}

// Create axios instances for test and production environments
export const createApiClient = (environment: 'test' | 'production' = 'test') => {
  const baseURL = environment === 'test'
    ? process.env.NEXT_PUBLIC_TEST_API_URL || process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_PRODUCTION_API_URL || process.env.NEXT_PUBLIC_API_URL;

  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  }) as CustomAxiosInstance;
};

// Default API client (test environment)
export const apiClient = createApiClient('test');

// Production API client
export const productionApiClient = createApiClient('production');

// Add request interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    // Skip auth header for login and register endpoints
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register')) {
      return config;
    }

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add merchant ID to headers if available
    const { useMerchantStore } = require('./stores/merchant-store');
    const selectedMerchant = useMerchantStore.getState().selectedMerchant;
    if (selectedMerchant?.id) {
      config.headers['X-Merchant-ID'] = selectedMerchant.id;
      console.log('Setting X-Merchant-ID header:', selectedMerchant.id);
    } else {
      console.log('No merchant selected, not setting X-Merchant-ID header');
    }

    console.log(`API Request [${config.method?.toUpperCase()}] ${config.url}:`, {
      data: config.data,
      params: config.params,
      headers: config.headers
    });

    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.config.method?.toUpperCase()}] ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error(`API Error [${error.config?.method?.toUpperCase()}] ${error.config?.url}:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);

// Add method to clear cache for both clients
const addClearCacheMethod = (client: CustomAxiosInstance) => {
  client.clearCache = async () => {
    // Clear any cached data in the API client
    client.defaults.headers.common = {};
  };
  return client;
};

// Apply the clear cache method to both clients
addClearCacheMethod(apiClient);
addClearCacheMethod(productionApiClient);