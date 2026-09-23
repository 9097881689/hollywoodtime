export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'hollywood@8093',
};

export const AUTH_COOKIE_NAME = 'ht_admin_auth';
export const AUTH_TOKEN_VALUE = 'ht_authenticated_session_token_2026';

export function verifyAdminCredentials(username?: string, password?: string): boolean {
  if (!username || !password) return false;
  const u = username.trim().toLowerCase();
  const p = password.trim();

  const isUserValid = u === 'admin' || u === 'hollywood' || u === 'hollywoodtime';
  const isPassValid = p === 'hollywood@8093';

  return isUserValid && isPassValid;
}

export function isAuthenticated(cookieValue?: string): boolean {
  return cookieValue === AUTH_TOKEN_VALUE;
}
