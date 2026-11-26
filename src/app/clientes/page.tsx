import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell';
import { DataHeader, DataError } from '@/components/data-state';
import { WorkspaceManagement } from '@/components/workspace/management';
import { requireWorkspace } from '@/lib/auth/session';
import { listClients } from '@/lib/workspace/reads';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Clientes' };

async function Records({
  workspace,
}: {
  workspace: Awaited<ReturnType<typeof requireWorkspace>>;
}) {
  const clients = await listClients(workspace);
  return clients ? (
    <WorkspaceManagement kind="clients" items={clients} />
  ) : (
    <DataError href="/clientes" />
  );
}

export default async function Page() {
  const workspace = await requireWorkspace();
  return (
    <AppShell>
      <DataHeader
        title="Clientes"
        description="Organiza y mantén al día las relaciones con tus clientes."
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
