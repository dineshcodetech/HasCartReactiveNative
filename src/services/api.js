

import { Platform } from 'react-native';
import { API_BASE_URL as ENV_API_URL, WEB_APP_URL } from '@env';

const API_BASE_URL = ENV_API_URL || 'https://api.hascart.in';

console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('Platform:', Platform.OS);

// Web Base URL for sharing links (e.g. https://hascart.club)
const isDev = __DEV__;
export const WEB_BASE_URL = WEB_APP_URL || 'https://hascart.in';

export { API_BASE_URL };

export const apiCall = async (endpoint, options = {}) => {
  try {
    // Merge headers properly - Content-Type should always be included for JSON
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Remove headers from options to avoid double spread
    const { headers: _, ...restOptions } = options;

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(fullUrl, "herere");

    console.log('[API] Request:', fullUrl, restOptions.method || 'GET');
    console.log('[API] Headers:', headers);

    const response = await fetch(fullUrl, {
      ...restOptions,
      headers,
    });

    console.log('[API] Response status:', response.status, response.statusText);

    const data = await response.json();
    console.log('[API] Response data:', data);

    return { data, status: response.status, ok: response.ok };
  } catch (error) {
    console.error('API Error:', error);
    console.error('API Error details:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

export const trackProductClick = async (productData, token) => {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return apiCall('/api/analytics/track-click', {
    method: 'POST',
    headers,
    body: JSON.stringify(productData),
  });
};

