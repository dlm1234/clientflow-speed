import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAuthCookieOptions } from '@/lib/auth/origin';
import { getSupabaseConfig } from './config';

export async function createServerSupabase(writable = false) {
  const config = getSupabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        if (writable)
          for (const { name, value, options } of values)
            store.set(name, value, options);
      },
    },
  });
}
