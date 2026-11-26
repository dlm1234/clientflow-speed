import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { AppShell } from '@/components/app-shell';
import { DataError, DataHeader } from '@/components/data-state';
import { requireWorkspace } from '@/lib/auth/session';
import { getWorkspaceCounts } from '@/lib/workspace/reads';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Dashboard' };

async function Overview({
  workspace,
}: {
  workspace: Awaited<ReturnType<typeof requireWorkspace>>;
}) {
  const metrics = await getWorkspaceCounts(workspace);
  return (
    <section className="workspace-overview" aria-labelledby="overview-title">
      <h2 id="overview-title">Resumen de tu actividad</h2>
      {metrics ? (
        <>
          <dl className="workspace-metrics">
            <div>
              <dt>Clientes</dt>
              <dd data-testid="metric-clients">{metrics.clients}</dd>
            </div>
            <div>
              <dt>Proyectos</dt>
              <dd data-testid="metric-projects">{metrics.projects}</dd>
            </div>
            <div>
              <dt>Proyectos en curso</dt>
              <dd data-testid="metric-in-progress">{metrics.active}</dd>
            </div>
          </dl>
          <h3>Proyectos por estado</h3>
          <dl className="workspace-distribution">
            {metrics.distribution.map(({ status, label, count }) => (
              <div key={status}>
                <dt>{label}</dt>
                <dd data-testid={`status-${status}`}>{count}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <DataError href="/dashboard" />
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const workspace = await requireWorkspace();
  return (
    <AppShell>
      <DataHeader
        title="Dashboard"
        description="Una visión clara de tus clientes y proyectos, en un solo lugar."
      />
      <Suspense
        fallback={
          <p role="status" className="workspace-empty">
            Cargando actividad…
          </p>
        }
      >
        <Overview workspace={workspace} />
      </Suspense>
      <section className="sections" aria-labelledby="sections-title">
        <div className="section-heading">
          <h2 id="sections-title">Un espacio para cada parte de tu negocio</h2>
          <span>Explora tu base de trabajo</span>
        </div>
        <div className="section-cards">
          <article className="section-card">
            <span className="card-icon clients-icon">
              <Icon name="clients" />
            </span>
            <h3>Clientes</h3>
            <p>
              Las personas detrás de cada oportunidad. Gestiona tus registros.
            </p>
            <Link href="/clientes">
              Explorar clientes
              <Icon name="arrow" />
            </Link>
          </article>
          <article className="section-card">
            <span className="card-icon projects-icon">
              <Icon name="projects" />
            </span>
            <h3>Proyectos</h3>
            <p>
              Del primer paso a la entrega. Organiza los proyectos vinculados a
              tus clientes.
            </p>
            <Link href="/proyectos">
              Explorar proyectos
              <Icon name="arrow" />
            </Link>
          </article>
        </div>
      </section>
    </AppShell>
  );
}
