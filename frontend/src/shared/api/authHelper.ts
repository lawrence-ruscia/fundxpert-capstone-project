let forceLogoutFn: ((reason?: string) => void) | null = null;

export const setForceLogout = (fn: (reason?: string) => void) => {
  forceLogoutFn = fn;
};

export const triggerForceLogout = (reason?: string) => {
  if (forceLogoutFn) forceLogoutFn(reason);
  else window.location.href = '/auth/login'; // fallback
};
