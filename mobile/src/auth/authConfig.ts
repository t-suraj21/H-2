/**
 * Mobile Client Configuration for HL²
 */

export const authConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.121.121:5001/api',
  customScheme: 'hl2',
};

export default authConfig;
