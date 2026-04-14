import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://business.folinko.com';
const TOKEN_KEY = '@customer_token';
const LEGACY_TOKEN_KEY = '@business_token';

// Global navigation reference for redirects
let navigationRef = null;
let pendingAuthRedirect = false;

export const setNavigationRef = (ref) => {
  navigationRef = ref;

  if (pendingAuthRedirect) {
    // Try to complete any pending redirect once navigator mounts.
    try {
      if (navigationRef?.isReady?.()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'feedScreen' }],
        });
        pendingAuthRedirect = false;
      }
    } catch (e) {
      // ignore and keep pending
    }
  }
};

const safeRedirectToLogin = () => {
  try {
    if (navigationRef?.isReady?.()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'feedScreen' }],
      });
      pendingAuthRedirect = false;
      return;
    }
  } catch (e) {
    // fall through to pending
  }

  pendingAuthRedirect = true;

  // Retry shortly in case navigator is still mounting.
  setTimeout(() => {
    try {
      if (pendingAuthRedirect && navigationRef?.isReady?.()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'feedScreen' }],
        });
        pendingAuthRedirect = false;
      }
    } catch (e) {
      // ignore and keep pending
    }
  }, 250);
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
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) return token;

    const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacyToken) {
      await AsyncStorage.setItem(TOKEN_KEY, legacyToken);
      await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
      return legacyToken;
    }

    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const removeAuthToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const { skipAuthRedirectOnUnauthorized = false, ...requestOptions } = options;
  const url = `${API_BASE}${endpoint}`;
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...requestOptions.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...requestOptions,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle authentication errors (401 Unauthorized)
      if (response.status === 401 && !skipAuthRedirectOnUnauthorized) {
        await removeAuthToken();
        // Navigate to LoginScreen
        safeRedirectToLogin();
        console.warn('Authentication expired - redirecting to feed');
        return;
      }

      return errorData;
      
      // throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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
    // console.error('API request error:', error);
    
    // Handle network errors or other auth-related issues
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      await removeAuthToken();
      // Navigate to LoginScreen
      safeRedirectToLogin();
      console.warn('Authentication error - redirecting to feed');
      return;
    }
    
    // throw error;
  }
};

const toQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `?${qs}`;
};

// Health check
export const healthCheck = () => apiRequest('/api/health');

// Business Auth
export const customerAuth = {
  register: (email, password) =>
    apiRequest('/api/customer/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: async (email, password) => {
    const response = await apiRequest('/api/customer/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuthRedirectOnUnauthorized: true,
    });

    const responseData = response?.data && typeof response.data === 'object' ? response.data : null;
    const accessToken =
      response?.access_token ||
      response?.token ||
      response?.auth_token ||
      responseData?.access_token ||
      responseData?.token ||
      responseData?.auth_token ||
      '';
    const user = response?.user || responseData?.user || responseData?.customer || response?.customer || null;

    if (accessToken) {
      await setAuthToken(accessToken);
      return {
        ...response,
        ...(responseData || {}),
        access_token: accessToken,
        user,
      };
    }

    if (response === undefined) {
      throw new Error('Unable to login right now. Please try again.');
    }

    const errorMessage =
      response?.errors?.email?.[0] ||
      response?.errors?.password?.[0] ||
      response?.errors?.[0] ||
      response?.detail ||
      response?.error ||
      response?.message ||
      'Invalid username or password';

    const normalizedErrorMessage = String(errorMessage).toLowerCase();

    if (
      !errorMessage ||
      normalizedErrorMessage.includes('validation_error') ||
      normalizedErrorMessage.includes('invalid') ||
      normalizedErrorMessage.includes('incorrect') ||
      normalizedErrorMessage.includes('credential') ||
      normalizedErrorMessage.includes('password') ||
      normalizedErrorMessage.includes('email') ||
      normalizedErrorMessage.includes('user')
    ) {
      throw new Error('Invalid username or password');
    }

    throw new Error(errorMessage);
  },

  getMe: () =>
    apiRequest('/api/customer/auth/me', {
      skipAuthRedirectOnUnauthorized: true,
    }),
};

export const businessAuth = customerAuth;

// Markets + Feed (browse)
export const markets = {
  list: () => apiRequest('/api/customer/markets'),
};

export const feed = {
  getFeed: ({ city, q, page = 1, page_size = 20 } = {}) =>
    apiRequest(`/api/customer/feed${toQueryString({ city, q, page, page_size })}`),
};

// Discover shops + shop profile (public)
export const shops = {
  discover: ({ city, q, sort, verified, photo, account_type, min_posts, page = 1, page_size = 30 } = {}) =>
    apiRequest(
      `/api/customer/shops${toQueryString({ city, q, sort, verified, photo, account_type, min_posts, page, page_size })}`
    ),

  getBySlug: (slug, { page = 1, page_size = 30 } = {}) =>
    apiRequest(`/api/customer/shops/${encodeURIComponent(slug)}${toQueryString({ page, page_size })}`),
};

// Posts (public)
export const posts = {
  getById: (postId) => apiRequest(`/api/customer/posts/${encodeURIComponent(String(postId))}`),
  related: (postId) => apiRequest(`/api/customer/posts/${encodeURIComponent(String(postId))}/related`),
  lookupByUrl: (url) => apiRequest(`/api/customer/posts/lookup${toQueryString({ url })}`),
  unlockByShare: (postId) =>
    apiRequest(`/api/customer/posts/${encodeURIComponent(String(postId))}/unlock/share`, {
      method: 'POST',
    }),
};

// Wishlist (requires customer token)
export const wishlist = {
  list: () => apiRequest('/api/customer/wishlist'),
  add: (postId) =>
    apiRequest(`/api/customer/wishlist/${encodeURIComponent(String(postId))}`, {
      method: 'POST',
    }),
  remove: (postId) =>
    apiRequest(`/api/customer/wishlist/${encodeURIComponent(String(postId))}`, {
      method: 'DELETE',
    }),
};

// Cart (requires customer token)
export const cart = {
  get: () => apiRequest('/api/customer/cart'),
  add: (postId, { quantity } = {}) =>
    apiRequest(`/api/customer/cart/${encodeURIComponent(String(postId))}`, {
      method: 'POST',
      body: JSON.stringify(quantity !== undefined ? { quantity } : {}),
    }),
  updateQuantity: (postId, { quantity }) =>
    apiRequest(`/api/customer/cart/${encodeURIComponent(String(postId))}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  remove: (postId) =>
    apiRequest(`/api/customer/cart/${encodeURIComponent(String(postId))}`, {
      method: 'DELETE',
    }),
};

// Saved addresses (requires customer token)
export const addresses = {
  list: () => apiRequest('/api/customer/addresses'),
  create: (address) =>
    apiRequest('/api/customer/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    }),
  remove: (addressId) =>
    apiRequest(`/api/customer/addresses/${encodeURIComponent(String(addressId))}`, {
      method: 'DELETE',
    }),
};

// Payment methods (requires customer token)
export const paymentMethods = {
  list: () => apiRequest('/api/customer/payment-methods'),
  create: (paymentMethod) =>
    apiRequest('/api/customer/payment-methods', {
      method: 'POST',
      body: JSON.stringify(paymentMethod),
    }),
  remove: (paymentMethodId) =>
    apiRequest(`/api/customer/payment-methods/${encodeURIComponent(String(paymentMethodId))}`, {
      method: 'DELETE',
    }),
};

// Checkout + Orders (requires customer token)
export const orders = {
  checkout: ({ post_id, address_id, payment_method_id } = {}) =>
    apiRequest('/api/customer/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(
        post_id !== undefined || address_id !== undefined || payment_method_id !== undefined
          ? { post_id, address_id, payment_method_id }
          : {}
      ),
    }),
  list: () => apiRequest('/api/customer/orders'),
  getById: (orderId) => apiRequest(`/api/customer/orders/${encodeURIComponent(String(orderId))}`),
};

// Reviews
export const reviews = {
  listForPost: (postId) => apiRequest(`/api/customer/posts/${encodeURIComponent(String(postId))}/reviews`),
  upsertMyReview: (postId, { rating, title, body }) =>
    apiRequest(`/api/customer/posts/${encodeURIComponent(String(postId))}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, title, body }),
    }),
};

export const collaboration = {
  influencers: ({ page = 1, page_size = 20 } = {}) =>
    apiRequest(`/api/business/collaboration/influencers${toQueryString({ page, page_size })}`, {
      skipAuthRedirectOnUnauthorized: true,
    }),
};

// Export all services as default
export default {
  healthCheck,
  customerAuth,
  businessAuth,
  markets,
  feed,
  shops,
  posts,
  wishlist,
  cart,
  addresses,
  paymentMethods,
  orders,
  reviews,
  collaboration,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
};
