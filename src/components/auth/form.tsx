import Link from 'next/link';
import { authenticate } from '@/lib/auth/actions';
import { getSupabaseConfig } from '@/lib/supabase/config';

const messages = {
  formulario:
    'Introduce un correo válido y la contraseña. Para registrarte, usa al menos ocho caracteres.',
  conexion:
    'No hemos podido conectar con el servicio. Inténtalo de nuevo más tarde.',
  credenciales:
    'No se pudo continuar con esos datos. Comprueba el correo y la contraseña.',
  confirmacion:
    'Revisa tu correo y confirma el registro antes de iniciar sesión.',
  enlace: 'El enlace no es válido o ha caducado.',
  canje:
    'No se pudo iniciar sesión desde el enlace. Si ya confirmaste tu correo, inicia sesión con tu contraseña.',
  origen: 'El registro requiere configurar la dirección de confirmación.',
  cerrada: 'Has cerrado sesión.',
  salida:
    'No se pudo cerrar la sesión. Vuelve al espacio de trabajo para reintentarlo.',
  limite:
    'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
};

export function AuthForm({
  mode,
  status,
}: {
  mode: 'login' | 'registro';
  status: string | undefined;
}) {
  const configured = Boolean(getSupabaseConfig());
  const login = mode === 'login';
  const title = login ? 'Iniciar sesión' : 'Crear cuenta';
  const message =
    status && Object.hasOwn(messages, status)
      ? messages[status as keyof typeof messages]
      : undefined;
  return (
    <main className="auth-main" id="main-content">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            cf<span>↗</span>
          </span>
          ClientFlow
        </div>
        <h1 id="auth-title">{title}</h1>
        {!configured ? (
          <p role="status">
            Configuración pendiente. Configura Supabase para acceder a tu
            espacio de trabajo.
          </p>
        ) : (
          <>
            {message && <p role="status">{message}</p>}
            <form action={authenticate.bind(null, mode)} className="auth-form">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={login ? 'current-password' : 'new-password'}
                required
                minLength={login ? undefined : 8}
                maxLength={1024}
              />
              <button className="auth-button" type="submit">
                {title}
              </button>
            </form>
            <p>
              <Link href={login ? '/registro' : '/login'}>
                {login ? 'Crear cuenta' : 'Volver a iniciar sesión'}
              </Link>
            </p>
            {status === 'salida' && (
              <p>
                <Link href="/dashboard">Volver al espacio de trabajo</Link>
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
