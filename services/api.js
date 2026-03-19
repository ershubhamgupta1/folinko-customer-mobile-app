import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://business.folinko.com';
const TOKEN_KEY = '@business_token';

// Global navigation reference for redirects
let navigationRef = null;

export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

export const setAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    console.log('url=========', url);
    console.log('response=========', response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle authentication errors (401 Unauthorized)
      if (response.status === 401) {
        await removeAuthToken();
        // Navigate to LoginScreen
        if (navigationRef) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
        console.warn('Authentication expired - redirecting to login');
        return;
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('svg')) {
        return response.text();
    } else {
      // For JSON responses, parse as JSON
      return await response.json();
    }
  } catch (error) {
    console.error('API request error:', error);
    
    // Handle network errors or other auth-related issues
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      await removeAuthToken();
      // Navigate to LoginScreen
      if (navigationRef) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
      console.warn('Authentication error - redirecting to login');
      return;
    }
    
    throw error;
  }
};

// Health check
export const healthCheck = () => apiRequest('/api/health');

// Business Auth
export const businessAuth = {
  register: (email, password) => 
    apiRequest('/api/business/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: async (email, password) => {
    const response = await apiRequest('/api/business/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.access_token) {
      await setAuthToken(response.access_token);
    }
    
    return response;
  },

  getMe: () => apiRequest('/api/business/auth/me'),
};

// Shop Management
export const shop = {
  getMyShop: () => apiRequest('/api/business/shops/me'),

  createOrUpdateShop: (shopData) => 
    apiRequest('/api/business/shops/me', {
      method: 'POST',
      body: JSON.stringify(shopData),
    }),

  getQRCode: () => apiRequest('/api/business/shops/me/qr'),
};

// Inventory Posts
export const inventory = {
  getPosts: (page = 1, pageSize = 20) => 
    apiRequest(`/api/business/inventory/posts?page=${page}&page_size=${pageSize}`),

  createPost: (postData) => 
    apiRequest('/api/business/inventory/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    }),

  getPost: (postId) => 
    apiRequest(`/api/business/inventory/posts/${postId}`),

  updatePost: (postId, postData) => 
    apiRequest(`/api/business/inventory/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    }),

  deletePost: (postId) => 
    apiRequest(`/api/business/inventory/posts/${postId}`, {
      method: 'DELETE',
    }),

  incrementShareCount: (postId) => 
    apiRequest(`/api/business/inventory/posts/${postId}/share`, {
      method: 'POST',
    }),
};

// Verification
export const verification = {
  getVerificationStatus: () => apiRequest('/api/business/verification/me'),

  saveDraft: (verificationData) => 
    apiRequest('/api/business/verification/draft', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    }),

  submitForReview: (verificationData) => 
    apiRequest('/api/business/verification/submit', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    }),
};

// Analytics
export const analytics = {
  getSummary: () => apiRequest('/api/business/analytics/summary'),

  getOverview: () => apiRequest('/api/business/analytics/overview'),
};

// Orders
export const orders = {
  getOrders: (page = 1, pageSize = 20) => 
    apiRequest(`/api/business/orders?page=${page}&page_size=${pageSize}`),

  getOrder: (orderId) => 
    apiRequest(`/api/business/orders/${orderId}`),

  updateFulfillment: (orderId, fulfillmentData) => 
    apiRequest(`/api/business/orders/${orderId}/fulfillment`, {
      method: 'PUT',
      body: JSON.stringify(fulfillmentData),
    }),
};

// Feed
export const feed = {
  getFeed: (limit = 50) => 
    apiRequest(`/api/business/feed?limit=${limit}`),
};

// Payouts
export const payouts = {
  getPayouts: () => apiRequest('/api/business/payouts/me'),
};

// Export all services as default
export default {
  healthCheck,
  businessAuth,
  shop,
  inventory,
  verification,
  analytics,
  orders,
  feed,
  payouts,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
};
