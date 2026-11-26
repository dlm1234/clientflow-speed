import 'server-only';

import {
  PROJECT_STATUSES,
  type ClientRow,
  type ClientOption,
  type ProjectRow,
} from '@/domain/entities';
import { requireWorkspace } from '@/lib/auth/session';

type Workspace = Awaited<ReturnType<typeof requireWorkspace>>;

async function allRows<T>(
  read: (
    start: number,
    end: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: unknown;
  }>,
) {
  const rows: T[] = [];
  const batch = 250;
  try {
    for (let start = 0; ;) {
      const { data, error } = await read(start, start + batch - 1);
      if (error || !data) return null;
      if (!data.length) return rows;
      rows.push(...data);
      if (data.length < batch) return rows;
      start += data.length;
    }
  } catch {
    return null;
  }
}

export function listClients({ client, owner }: Workspace) {
  return allRows<ClientRow>((start, end) =>
    client
      .from('clients')
      .select('id,name,email,phone,company,notes')
      .eq('owner_id', owner)
      .order('name')
      .order('id')
      .range(start, end)
      .returns<ClientRow[]>(),
  );
}

export async function listProjects({ client, owner }: Workspace) {
  const [projects, clients] = await Promise.all([
    allRows<ProjectRow>((start, end) =>
      client
        .from('projects')
        .select('id,name,description,client_id,status')
        .eq('owner_id', owner)
        .order('name')
        .order('id')
        .range(start, end)
        .returns<ProjectRow[]>(),
    ),
    allRows<ClientOption>((start, end) =>
      client
        .from('clients')
        .select('id,name')
        .eq('owner_id', owner)
        .order('name')
        .order('id')
        .range(start, end)
        .returns<ClientOption[]>(),
    ),
  ]);
  return projects && clients ? { projects, clients } : null;
}

export async function getWorkspaceCounts({ client, owner }: Workspace) {
  try {
    const [clients, projects, ...statuses] = await Promise.all([
      client
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', owner),
      client
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', owner),
      ...PROJECT_STATUSES.map(([status]) =>
        client
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', owner)
          .eq('status', status),
      ),
    ]);
    if (
      clients.error ||
      clients.count === null ||
      projects.error ||
      projects.count === null
    )
      return null;
    const distribution = [];
    for (const [index, [status, label]] of PROJECT_STATUSES.entries()) {
      const result = statuses[index];
      if (result.error || result.count === null) return null;
      distribution.push({ status, label, count: result.count });
    }
    return {
      clients: clients.count,
      projects: projects.count,
      distribution,
      active: distribution.find(({ status }) => status === 'in_progress')!
        .count,
    };
  } catch {
    return null;
  }
}
