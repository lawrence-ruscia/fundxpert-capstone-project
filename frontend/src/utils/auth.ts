// TODO: switch to httpOnly cookies later
export function getToken() {
  return localStorage.getItem('token');
}

export function getRole() {
  return localStorage.getItem('role') as 'Employee' | 'HR' | 'Admin' | null;
}

export function isAuthenticated() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  sessionStorage.removeItem('twofa_userId');
}
