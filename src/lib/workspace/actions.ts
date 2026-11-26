'use server';

import { revalidatePath } from 'next/cache';
import { requireWorkspace } from '@/lib/auth/session';
import { PROJECT_STATUSES } from '@/domain/entities';

export type Kind = 'clients' | 'projects';
export type Operation = 'create' | 'edit' | 'delete';
export type MutationResult = { ok: boolean; message: string };

const idPattern =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fail = (message: string): MutationResult => ({ ok: false, message });

function field(form: FormData, name: string, max: number) {
  const raw = form.get(name);
  if (raw === null) return null;
  if (typeof raw !== 'string' || raw.length > max) throw new Error('field');
  return raw.trim() || null;
}

function readClient(form: FormData) {
  const name = field(form, 'name', 160);
  const email = field(form, 'email', 254);
  if (!name) return fail('Introduce el nombre del cliente.');
  if (email && !emailPattern.test(email))
    return fail('Introduce un correo electrónico válido.');
  return {
    name,
    email,
    phone: field(form, 'phone', 60),
    company: field(form, 'company', 160),
    notes: field(form, 'notes', 2000),
  };
}

function readProject(form: FormData) {
  const name = field(form, 'name', 160);
  const client_id = field(form, 'client_id', 36);
  const status = field(form, 'status', 24);
  if (!name) return fail('Introduce el nombre del proyecto.');
  if (!client_id || !idPattern.test(client_id))
    return fail('Selecciona un cliente válido.');
  if (!PROJECT_STATUSES.some(([value]) => value === status))
    return fail('Selecciona un estado válido.');
  return {
    name,
    client_id,
    status,
    description: field(form, 'description', 2000),
  };
}

export async function mutateWorkspace(
  kind: Kind,
  operation: Operation,
  id: string | null,
  form: FormData,
): Promise<MutationResult> {
  const { client, owner } = await requireWorkspace();
  if (
    (kind !== 'clients' && kind !== 'projects') ||
    (operation !== 'create' && operation !== 'edit' && operation !== 'delete')
  ) {
    return fail('La operación solicitada no es válida.');
  }
  if (
    operation !== 'create' &&
    (typeof id !== 'string' || !idPattern.test(id))
  ) {
    return fail('El identificador del registro no es válido.');
  }
  const noun = kind === 'clients' ? 'Cliente' : 'Proyecto';
  try {
    let result: { data: unknown; error: { code: string } | null };
    const table = client.from(kind);
    if (operation !== 'delete') {
      let values;
      try {
        values = kind === 'clients' ? readClient(form) : readProject(form);
      } catch {
        return fail('Revisa los campos y su longitud antes de guardar.');
      }
      if ('ok' in values) return values;
      if (kind === 'projects') {
        const associated = await client
          .from('clients')
          .select('id')
          .eq('owner_id', owner)
          .eq('id', 'client_id' in values ? values.client_id : '')
          .maybeSingle();
        if (associated.error)
          return fail('No se pudo comprobar el cliente. Inténtalo de nuevo.');
        if (!associated.data)
          return fail('El cliente seleccionado ya no está disponible.');
      }
      const payload: Record<string, string | null> = values;
      result =
        operation === 'create'
          ? await table.insert(payload).select('id').maybeSingle()
          : await table
              .update(payload)
              .eq('owner_id', owner)
              .eq('id', id)
              .select('id')
              .maybeSingle();
    } else {
      result = await table
        .delete()
        .eq('owner_id', owner)
        .eq('id', id)
        .select('id')
        .maybeSingle();
    }

    if (result.error) {
      if (result.error.code === '23503') {
        if (kind === 'clients' && operation === 'delete') {
          return fail(
            'No puedes eliminar este cliente porque tiene proyectos asociados. Elimina o reasigna sus proyectos antes.',
          );
        }
        if (kind === 'projects')
          return fail('El cliente seleccionado ya no está disponible.');
      }
      return fail(
        operation === 'delete'
          ? 'No se pudo eliminar el registro. Inténtalo de nuevo.'
          : 'No se pudo guardar el registro. Inténtalo de nuevo.',
      );
    }
    if (!result.data)
      return fail('El registro no está disponible o ya no existe.');
  } catch {
    return fail(
      'No se pudo completar la operación. Revisa la conexión e inténtalo de nuevo.',
    );
  }

  revalidatePath('/clientes');
  revalidatePath('/proyectos');
  revalidatePath('/dashboard');
  return {
    ok: true,
    message:
      noun +
      (operation === 'create'
        ? ' creado.'
        : operation === 'edit'
          ? ' actualizado.'
          : ' eliminado.'),
  };
}
