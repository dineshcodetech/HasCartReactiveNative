

import { Platform } from 'react-native';

import { PRODUCTION_API_URL, ANDROID_DEVICE_IP, IOS_DEVICE_IP, API_PORT } from '@env';

const PRODUCTION_API_URL_INTERNAL = 'https://api.hascart.in';
let API_BASE_URL;

if (PRODUCTION_API_URL && !PRODUCTION_API_URL.includes('localhost')) {
  API_BASE_URL = PRODUCTION_API_URL;
} else if (PRODUCTION_API_URL_INTERNAL) {
  API_BASE_URL = PRODUCTION_API_URL_INTERNAL;
} else {
  if (Platform.OS === 'android') {
    const ip = ANDROID_DEVICE_IP || '10.0.2.2';
    const port = API_PORT ? API_PORT.replace(':', '') : '3001';
    API_BASE_URL = `http://${ip}:${port}`;
  } else {
    const ip = IOS_DEVICE_IP || 'localhost';
    const port = API_PORT ? API_PORT.replace(':', '') : '3001';
    API_BASE_URL = `http://${ip}:${port}`;
  }
}

// Sanitize URL to remove accidental double colons if PRODUCTION_API_URL had issues
API_BASE_URL = API_BASE_URL.replace(/([^:]\/)\/+/g, "$1").replace('::', ':');
if (!API_BASE_URL.endsWith('/')) {
  // We keep it without trailing slash as endpoints start with /
}


console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('Platform:', Platform.OS);

// Web Base URL for sharing links (e.g. https://hascart.club)
// You should add WEB_APP_URL to your .env file
import { WEB_APP_URL } from '@env';
const isDev = !PRODUCTION_API_URL || PRODUCTION_API_URL.includes('localhost');
export const WEB_BASE_URL = WEB_APP_URL || (isDev ? 'http://localhost:5173' : 'https://hascart.club');

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

