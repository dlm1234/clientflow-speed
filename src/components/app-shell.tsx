import { signOut } from '@/lib/auth/actions';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from './icon';
import { Navigation } from './navigation';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <aside className="sidebar" aria-label="Menú de ClientFlow">
        <Link
          href="/dashboard"
          className="brand"
          aria-label="ClientFlow, ir al dashboard"
        >
          <span className="brand-mark" aria-hidden="true">
            cf<span>↗</span>
          </span>
          <span>
            ClientFlow
            <span className="brand-caption">MENOS RUIDO. MÁS FOCO.</span>
          </span>
        </Link>
        <p className="nav-caption">ESPACIO DE TRABAJO</p>
        <Navigation />
        <div className="sidebar-note">
          <span className="note-icon">
            <Icon name="layers" />
          </span>
          <p>
            Las buenas relaciones
            <br />
            mueven los buenos proyectos.
          </p>
          <span>Un lugar para conectar ambos.</span>
        </div>
        <div className="sidebar-footer">
          <span className="local-dot" />
          Espacio privado
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="workspace-label">
            <span className="workspace-symbol" aria-hidden="true">
              C
            </span>
            Mi espacio de trabajo
          </span>
          <form action={signOut}>
            <button className="auth-button" type="submit">
              Cerrar sesión
            </button>
          </form>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="workspace-footer">
          <span>ClientFlow</span>
          <span>Una base sólida para lo que viene.</span>
        </footer>
      </div>
    </div>
  );
}
