import 'server-only';

export function getAppOrigin(): URL | null {
  const value = process.env.APP_ORIGIN?.trim();
  if (!value || !/^https?:\/\/[a-z0-9.[\]:-]+\/?$/i.test(value)) return null;

  try {
    const origin = new URL(value);
    const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(
      origin.hostname,
    );
    if (origin.protocol !== 'https:' && !loopback) return null;
    return origin;
  } catch {
    return null;
  }
}

export function getAuthCallbackUrl(): string | null {
  const origin = getAppOrigin();
  return origin ? new URL('/auth/confirm', origin).href : null;
}

export function getAuthCookieOptions() {
  return getAppOrigin()?.protocol === 'https:' ? { secure: true } : undefined;
}
