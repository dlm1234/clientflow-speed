import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/form';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  return <AuthForm mode="login" status={(await searchParams).estado} />;
}
