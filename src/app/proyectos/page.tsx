import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell';
import { DataHeader, DataError } from '@/components/data-state';
import { WorkspaceManagement } from '@/components/workspace/management';
import { requireWorkspace } from '@/lib/auth/session';
import { listProjects } from '@/lib/workspace/reads';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Proyectos' };

async function Records({
  workspace,
}: {
  workspace: Awaited<ReturnType<typeof requireWorkspace>>;
}) {
  const data = await listProjects(workspace);
  return data ? (
    <WorkspaceManagement
      kind="projects"
      items={data.projects}
      clients={data.clients}
    />
  ) : (
    <DataError href="/proyectos" />
  );
}

export default async function Page() {
  const workspace = await requireWorkspace();
  return (
    <AppShell>
      <DataHeader
        title="Proyectos"
        description="Sigue el estado de tus proyectos y los clientes que hay detrás."
      />
      <Suspense
        fallback={
          <p role="status" className="workspace-empty">
            Cargando registros…
          </p>
        }
      >
        <Records workspace={workspace} />
      </Suspense>
    </AppShell>
  );
}
