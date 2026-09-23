export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'hollywood@8093',
};

export const AUTH_COOKIE_NAME = 'ht_admin_auth';
export const AUTH_TOKEN_VALUE = 'ht_authenticated_session_token_2026';

export const MAX_FAILED_ATTEMPTS = 10;
export const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours in milliseconds

// Fallback in-memory map for fast edge tracking
const memoryAttempts = new Map<string, { failedCount: number; lockedUntil?: number }>();

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

/**
 * Checks if the IP is currently locked out due to >10 failed login attempts.
 */
export async function checkLoginLockout(ip: string, d1?: any): Promise<{
  isLocked: boolean;
  remainingHours?: number;
  remainingMinutes?: number;
  lockedUntil?: string;
  failedCount: number;
}> {
  const now = Date.now();

  // Check in-memory first
  const mem = memoryAttempts.get(ip);
  if (mem && mem.lockedUntil && mem.lockedUntil > now) {
    const diffMs = mem.lockedUntil - now;
    const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));
    const remainingMinutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      isLocked: true,
      remainingHours,
      remainingMinutes,
      lockedUntil: new Date(mem.lockedUntil).toISOString(),
      failedCount: mem.failedCount,
    };
  }

  // Check persistent Cloudflare D1 SQLite database
  if (d1) {
    try {
      const stmt = d1.prepare('SELECT failed_count, locked_until FROM login_attempts WHERE ip = ? LIMIT 1').bind(ip);
      const row = await stmt.first();

      if (row && row.locked_until) {
        const lockedTime = new Date(row.locked_until).getTime();
        if (lockedTime > now) {
          const diffMs = lockedTime - now;
          const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));
          const remainingMinutes = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));

          // Sync back to memory
          memoryAttempts.set(ip, { failedCount: row.failed_count, lockedUntil: lockedTime });

          return {
            isLocked: true,
            remainingHours,
            remainingMinutes,
            lockedUntil: row.locked_until,
            failedCount: row.failed_count,
          };
        } else {
          // Lockout period has elapsed: reset
          await resetLoginAttempts(ip, d1);
          return { isLocked: false, failedCount: 0 };
        }
      }

      return { isLocked: false, failedCount: row ? (row.failed_count || 0) : 0 };
    } catch (err) {
      console.warn('D1 checkLoginLockout fallback to memory:', err);
    }
  }

  return { isLocked: false, failedCount: mem ? mem.failedCount : 0 };
}

/**
 * Records a failed attempt and triggers a 24-hour lock if >= 10 attempts.
 */
export async function recordFailedAttempt(ip: string, d1?: any): Promise<{
  isLocked: boolean;
  failedCount: number;
  remainingAttempts: number;
  lockedUntil?: string;
}> {
  const current = await checkLoginLockout(ip, d1);
  const newCount = (current.failedCount || 0) + 1;
  const now = Date.now();
  const lastAttempt = new Date(now).toISOString();

  if (newCount >= MAX_FAILED_ATTEMPTS) {
    const lockTime = now + LOCKOUT_DURATION_MS;
    const lockedUntil = new Date(lockTime).toISOString();

    memoryAttempts.set(ip, { failedCount: newCount, lockedUntil: lockTime });

    if (d1) {
      try {
        await d1.prepare(`
          INSERT INTO login_attempts (ip, failed_count, locked_until, last_attempt)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(ip) DO UPDATE SET
            failed_count = excluded.failed_count,
            locked_until = excluded.locked_until,
            last_attempt = excluded.last_attempt
        `).bind(ip, newCount, lockedUntil, lastAttempt).run();
      } catch (err) {
        console.error('D1 recordFailedAttempt lock write error:', err);
      }
    }

    return {
      isLocked: true,
      failedCount: newCount,
      remainingAttempts: 0,
      lockedUntil,
    };
  }

  // Not locked yet, record attempt count
  memoryAttempts.set(ip, { failedCount: newCount });

  if (d1) {
    try {
      await d1.prepare(`
        INSERT INTO login_attempts (ip, failed_count, locked_until, last_attempt)
        VALUES (?, ?, NULL, ?)
        ON CONFLICT(ip) DO UPDATE SET
          failed_count = excluded.failed_count,
          locked_until = NULL,
          last_attempt = excluded.last_attempt
      `).bind(ip, newCount, lastAttempt).run();
    } catch (err) {
      console.error('D1 recordFailedAttempt attempt write error:', err);
    }
  }

  return {
    isLocked: false,
    failedCount: newCount,
    remainingAttempts: MAX_FAILED_ATTEMPTS - newCount,
  };
}

/**
 * Resets failed attempts after successful login or lockout expiry.
 */
export async function resetLoginAttempts(ip: string, d1?: any): Promise<void> {
  memoryAttempts.delete(ip);

  if (d1) {
    try {
      await d1.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
    } catch (err) {
      console.warn('D1 resetLoginAttempts error:', err);
    }
  }
}
