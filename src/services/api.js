// API Configuration
// IMPORTANT: For physical Android device, you need to use your computer's IP address
// Find your IP: 
//   - Mac/Linux: run `ifconfig | grep "inet "` or `ipconfig getifaddr en0`
//   - Windows: run `ipconfig` and look for IPv4 Address
//   - Make sure your phone and computer are on the same WiFi network
//
// Configuration is now loaded from .env file
// Update .env file to change the IP address and port

import {Platform} from 'react-native';

// Environment variables are loaded from .env file
import {ANDROID_DEVICE_IP, IOS_DEVICE_IP, API_PORT} from '@env';

const DEVICE_IP = Platform.OS === 'android' 
  ? (ANDROID_DEVICE_IP || '192.168.0.25')  // Your computer's IP for physical device
  : (IOS_DEVICE_IP || 'localhost');        // For iOS simulator

export const API_BASE_URL = `http://${DEVICE_IP}:${API_PORT || 3000}`;

// Log the API URL for debugging
console.log('API_BASE_URL configured as:', API_BASE_URL);
console.log('Platform:', Platform.OS);

export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return {data, status: response.status, ok: response.ok};
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

