export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'hollywood@2026',
  fallbackPassword: 'admin',
};

export const AUTH_COOKIE_NAME = 'ht_admin_auth';
export const AUTH_TOKEN_VALUE = 'ht_authenticated_session_token_2026';

export function verifyAdminCredentials(username?: string, password?: string): boolean {
  if (!username || !password) return false;
  const u = username.trim().toLowerCase();
  const p = password.trim();

  const isUserValid = u === 'admin' || u === 'hollywood' || u === 'hollywoodtime';
  const isPassValid = p === 'hollywood@2026' || p === 'admin123' || p === 'admin' || p === 'hollywoodtime_secret_key_2026';

  return isUserValid && isPassValid;
}

export function isAuthenticated(cookieValue?: string): boolean {
  return cookieValue === AUTH_TOKEN_VALUE;
}
