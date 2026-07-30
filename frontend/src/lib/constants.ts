const rawApiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api/v1';
const cleanedUrl = rawApiUrl.trim().replace(/\/$/, '');
export const API_URL = cleanedUrl.endsWith('/api/v1') ? cleanedUrl : `${cleanedUrl}/api/v1`;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  DASHBOARD: '/dashboard',
  CONVERSATION: '/c/:conversationId',
  REPORT: '/report/:token',
} as const;
