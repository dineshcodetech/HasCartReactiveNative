// API Configuration
// IMPORTANT: For physical Android device, you need to use your computer's IP address
// Find your IP: 
//   - Mac/Linux: run `ifconfig | grep "inet "` or `ipconfig getifaddr en0`
//   - Windows: run `ipconfig` and look for IPv4 Address
//   - Make sure your phone and computer are on the same WiFi network

import {Platform} from 'react-native';

// For Android emulator, use 10.0.2.2
// For physical Android device, use your computer's local IP (e.g., 192.168.1.100)
// For iOS simulator, use localhost

// IMPORTANT: If you're using a PHYSICAL Android device, uncomment the line below
// and replace '192.168.1.XXX' with your computer's IP address
// You can find it by running: ifconfig (Mac/Linux) or ipconfig (Windows)
// Make sure your phone and computer are on the same WiFi network

// For physical Android device, use your computer's IP address
// Your computer's IP: 10.150.225.118
// For Android emulator, use 10.0.2.2
// For iOS simulator, use localhost

// IMPORTANT: Since you're using a PHYSICAL Android device, we'll use your computer's IP
// Make sure your phone and computer are on the same WiFi network
const DEVICE_IP = Platform.OS === 'android' 
  ? '10.150.225.118'  // Your computer's IP for physical device
  : 'localhost';       // For iOS simulator

export const API_BASE_URL = `http://${DEVICE_IP}:3000`;

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

