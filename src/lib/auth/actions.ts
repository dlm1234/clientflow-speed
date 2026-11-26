'use server';

import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAuthCallbackUrl } from '@/lib/auth/origin';

export async function authenticate(mode: 'login' | 'registro', form: FormData) {
  if (mode !== 'login' && mode !== 'registro') redirect('/login');
  const path = mode === 'login' ? '/login' : '/registro';
  const email = form.get('email');
  const password = form.get('password');
  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== 'string' ||
    !password ||
    password.length > 1024 ||
    (mode === 'registro' && password.length < 8)
  )
    redirect(path + '?estado=formulario');
  const client = await createServerSupabase(true);
  if (!client) redirect(path + '?estado=configuracion');
  const emailRedirectTo = mode === 'registro' ? getAuthCallbackUrl() : null;
  if (mode === 'registro' && !emailRedirectTo)
    redirect(path + '?estado=origen');
  let result;
  try {
    const credentials = { email: email.trim(), password };
    result = await (mode === 'login'
      ? client.auth.signInWithPassword(credentials)
      : client.auth.signUp({
          ...credentials,
          options: { emailRedirectTo: emailRedirectTo ?? undefined },
        }));
  } catch {
    redirect(path + '?estado=conexion');
  }
  if (result.error) {
    if (
      isAuthRetryableFetchError(result.error) ||
      !result.error.status ||
      result.error.status >= 500
    )
      redirect(path + '?estado=conexion');
    if (result.error.status === 429) redirect(path + '?estado=limite');
    if (result.error.code === 'email_not_confirmed')
      redirect(path + '?estado=confirmacion');
    redirect(path + '?estado=credenciales');
  }
  if (mode === 'registro' && !result.data.session)
    redirect('/login?estado=confirmacion');
  redirect('/dashboard');
}

export async function signOut() {
  const client = await createServerSupabase(true);
  if (!client) redirect('/login?estado=configuracion');
  let error;
  try {
    ({ error } = await client.auth.signOut({ scope: 'local' }));
  } catch {
    redirect('/login?estado=salida');
  }
  if (error) redirect('/login?estado=salida');
  redirect('/login?estado=cerrada');
}
