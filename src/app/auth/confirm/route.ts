import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

type Destination =
  | '/dashboard'
  | '/login?estado=enlace'
  | '/login?estado=canje'
  | '/login?estado=configuracion'
  | '/login?estado=conexion';

function finish(location: Destination) {
  return new NextResponse(null, {
    status: 307,
    headers: {
      location,
      'cache-control': 'private, no-store',
      'referrer-policy': 'no-referrer',
    },
  });
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const codes = query.getAll('code');
  const tokens = query.getAll('token_hash');
  const types = query.getAll('type');
  const code = codes[0];
  const token = tokens[0];
  const validInput = (value: string | undefined): value is string =>
    Boolean(value && /^[A-Za-z0-9_-]{1,512}$/.test(value));

  const pkce =
    codes.length === 1 &&
    validInput(code) &&
    tokens.length === 0 &&
    types.length === 0;
  // Retain the previously documented custom template for in-flight links.
  const legacy =
    codes.length === 0 &&
    tokens.length === 1 &&
    validInput(token) &&
    types.length === 1 &&
    types[0] === 'email';
  if (!pkce && !legacy) return finish('/login?estado=enlace');

  const client = await createServerSupabase(true);
  if (!client) return finish('/login?estado=configuracion');

  try {
    const { data, error } = pkce
      ? await client.auth.exchangeCodeForSession(code)
      : await client.auth.verifyOtp({ type: 'email', token_hash: token });
    if (
      error &&
      (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500)
    ) {
      return finish('/login?estado=conexion');
    }
    if (error || !data.session)
      return finish(pkce ? '/login?estado=canje' : '/login?estado=enlace');
  } catch {
    return finish('/login?estado=conexion');
  }
  return finish('/dashboard');
}
