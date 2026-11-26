import { randomUUID } from 'node:crypto';

// Per-process fixture state on loopback. This is a Data API contract double,
// not PostgreSQL, PostgREST or RLS verification.
const rows = { clients: new Map(), projects: new Map() };
const fields = {
  clients: ['name', 'email', 'phone', 'company', 'notes'],
  projects: ['name', 'description', 'client_id', 'status'],
};

export async function serveWorkspace({
  request,
  response,
  url,
  user,
  json,
  readJson,
}) {
  const kind = url.pathname.split('/').at(-1);
  if (!user || !Object.hasOwn(rows, kind)) {
    return json(response, 401, { code: '42501', message: 'Not authorized' });
  }
  if (user.email.startsWith('read-error-')) {
    return json(response, 503, { message: 'Fixture read unavailable' });
  }

  const table = rows[kind];
  if (
    request.method !== 'POST' &&
    url.searchParams.get('owner_id') !== `eq.${user.id}`
  ) {
    return json(response, 400, { message: 'Required owner filter omitted' });
  }
  const matches = [...table.values()].filter(
    (row) =>
      row.owner_id === user.id &&
      ['id', 'status'].every(
        (field) =>
          !url.searchParams.has(field) ||
          url.searchParams.get(field) === `eq.${row[field]}`,
      ),
  );
  const projection = (row) =>
    Object.fromEntries(
      (url.searchParams.get('select') || 'id')
        .split(',')
        .map((column) => [column, row[column]]),
    );
  if (request.method === 'HEAD' || request.method === 'GET') {
    const total = matches.length;
    response.setHeader(
      'content-range',
      total ? `0-${total - 1}/${total}` : '*/0',
    );
    if (request.method === 'HEAD') return response.writeHead(200).end();
    const start = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 250);
    return json(
      response,
      200,
      matches
        .sort(
          (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
        )
        .slice(start, start + limit)
        .map(projection),
    );
  }
  if (request.method === 'DELETE') {
    if (
      kind === 'clients' &&
      matches.some(({ id }) =>
        [...rows.projects.values()].some((project) => project.client_id === id),
      )
    ) {
      return json(response, 409, {
        code: '23503',
        message: 'Referenced client',
      });
    }
    for (const { id } of matches) table.delete(id);
    return json(response, 200, matches.map(projection));
  }
  if (request.method === 'POST' || request.method === 'PATCH') {
    const payload = await readJson(request);
    if (Object.keys(payload).some((key) => !fields[kind].includes(key))) {
      return json(response, 403, { code: '42501', message: 'Column denied' });
    }
    if (payload.name === 'Error simulado') {
      return json(response, 503, { message: 'Fixture write unavailable' });
    }
    if (
      kind === 'projects' &&
      rows.clients.get(payload.client_id)?.owner_id !== user.id
    ) {
      return json(response, 409, {
        code: '23503',
        message: 'Unavailable client',
      });
    }
    if (request.method === 'POST') {
      const row = { ...payload, id: randomUUID(), owner_id: user.id };
      table.set(row.id, row);
      return json(response, 201, [projection(row)]);
    }
    const updated = matches.map((previous) => {
      const row = { ...previous, ...payload };
      table.set(row.id, row);
      return projection(row);
    });
    return json(response, 200, updated);
  }
  return json(response, 405, { message: 'Unsupported fixture request' });
}
