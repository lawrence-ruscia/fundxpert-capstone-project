import { authService } from '@/features/auth/services/authService';
export function getToken() {
  return localStorage.getItem('token');
}

export function getRole() {
  return localStorage.getItem('role') as 'Employee' | 'HR' | 'Admin' | null;
}

export function isAuthenticated() {
  return !!getToken();
}

export async function logout() {
  try {
    await authService.logoutUser();
  } catch (err) {
    console.error('Error logging out:', err);
  } finally {
    // Clear client-only data
    sessionStorage.removeItem('twofa_userId');

    localStorage.removeItem('role');
  }
}
