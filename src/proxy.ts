import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { getAuthCookieOptions } from '@/lib/auth/origin';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getSupabaseConfig();
  if (config) {
    const supabase = createServerClient(config.url, config.key, {
      cookieOptions: getAuthCookieOptions(),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          for (const { name, value } of values)
            request.cookies.set(name, value);
          const previous = response;
          response = NextResponse.next({ request });
          previous.cookies
            .getAll()
            .forEach((cookie) => response.cookies.set(cookie));
          for (const { name, value, options } of values)
            response.cookies.set(name, value, options);
          for (const [name, value] of Object.entries(headers ?? {}))
            response.headers.set(name, value);
        },
      },
    });
    // Refresh before the Server Component independently checks identity.
    try {
      await supabase.auth.getClaims();
    } catch {
      // The authorization gate fails closed and reports the provider error.
    }
  }
  response.headers.set('Cache-Control', 'private, no-store');
  if (request.nextUrl.pathname === '/auth/confirm')
    response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clientes/:path*',
    '/proyectos/:path*',
    '/login',
    '/registro',
    '/auth/confirm',
  ],
};
