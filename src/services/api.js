

import { Platform } from 'react-native';

// Environment variables are loaded from .env file
import { PRODUCTION_API_URL, ANDROID_DEVICE_IP, IOS_DEVICE_IP, API_PORT } from '@env';

let API_BASE_URL;

if (PRODUCTION_API_URL && !PRODUCTION_API_URL.includes('localhost')) {
  // Production mode - use the production backend URL
  API_BASE_URL = PRODUCTION_API_URL;
} else {
  // Development mode
  if (Platform.OS === 'android') {
    // 10.0.2.2 is the special alias for host localhost in Android Emulator
    // Use the env var if provided (for physical devices), otherwise default to user's IP
    const ip = ANDROID_DEVICE_IP || '172.20.10.2';
    API_BASE_URL = `http://${ip}:${API_PORT || 3000}`;
  } else {
    // iOS or other
    const ip = IOS_DEVICE_IP || 'localhost';
    API_BASE_URL = `http://${ip}:${API_PORT || 3000}`;
  }
}

// Log the API URL for debugging
console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('Platform:', Platform.OS);

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

    console.log('[API] Request:', endpoint, restOptions.method || 'GET');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers,
    });

    const data = await response.json();
    return { data, status: response.status, ok: response.ok };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const trackProductClick = async (productData, token) => {
  return apiCall('/api/analytics/track-click', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
};

