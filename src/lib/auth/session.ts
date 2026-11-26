import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export const requireWorkspace = cache(async () => {
  const client = await createServerSupabase();
  if (!client) redirect('/login?estado=configuracion');
  let identity;
  try {
    identity = await client.auth.getClaims();
  } catch {
    redirect('/login?estado=conexion');
  }
  if (
    identity.error &&
    !['AuthSessionMissingError', 'AuthInvalidJwtError'].includes(
      identity.error.name,
    ) &&
    ![
      'session_not_found',
      'refresh_token_not_found',
      'refresh_token_already_used',
      'bad_jwt',
    ].includes(identity.error.code ?? '') &&
    identity.error.status !== 401 &&
    identity.error.status !== 403
  )
    redirect('/login?estado=conexion');
  if (
    identity.error ||
    typeof identity.data?.claims?.sub !== 'string' ||
    !identity.data.claims.sub ||
    identity.data.claims.is_anonymous === true
  )
    redirect('/login');
  return { client, owner: identity.data.claims.sub };
});

export async function readPresence(table: 'clients' | 'projects') {
  const { client, owner } = await requireWorkspace();
  try {
    const { data, error } = await client
      .from(table)
      .select('id')
      .eq('owner_id', owner)
      .limit(1);
    if (error || !data) return 'error';
    return data.length ? 'present' : 'empty';
  } catch {
    return 'error';
  }
}
