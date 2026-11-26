import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth/form';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  return <AuthForm mode="registro" status={(await searchParams).estado} />;
}
