'use client';

import Link from 'next/link';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import {
  PROJECT_STATUSES,
  type ClientOption,
  type ClientRow,
  type ProjectRow,
} from '@/domain/entities';
import {
  mutateWorkspace,
  type Kind,
  type MutationResult,
  type Operation,
} from '@/lib/workspace/actions';

type Item = ClientRow | ProjectRow;
type Selection = { operation: Operation; item?: Item };

function MutationForm({
  kind,
  selection,
  clients,
  title,
  onSuccess,
  onCancel,
  setPending,
}: {
  kind: Kind;
  selection: Selection;
  clients: ClientOption[];
  title: string;
  onSuccess: (message: string) => void;
  onCancel: () => void;
  setPending: (pending: boolean) => void;
}) {
  const item = selection.item;
  const deleting = selection.operation === 'delete';
  const project = kind === 'projects';
  const [draft, setDraft] = useState<Record<string, string>>(
    (): Record<string, string> => {
      if (item && 'client_id' in item) {
        return {
          name: item.name,
          client_id: item.client_id,
          status: item.status,
          description: item.description ?? '',
        };
      }
      return {
        name: item?.name ?? '',
        email: item?.email ?? '',
        phone: item?.phone ?? '',
        company: item?.company ?? '',
        notes: item?.notes ?? '',
        client_id: '',
        status: 'planned',
        description: '',
      };
    },
  );
  const [result, submit, pending] = useActionState(
    async (_previous: MutationResult | null, data: FormData) => {
      try {
        const result = await mutateWorkspace(
          kind,
          selection.operation,
          item?.id ?? null,
          data,
        );
        if (result.ok) onSuccess(result.message);
        return result;
      } finally {
        setPending(false);
      }
    },
    null,
  );
  const update = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));
  const input = (
    key: string,
    label: string,
    maxLength: number,
    type = 'text',
    required = false,
  ) => (
    <label>
      {label}
      <input
        name={key}
        type={type}
        maxLength={maxLength}
        required={required}
        value={draft[key]}
        onChange={(event) => update(key, event.target.value)}
      />
    </label>
  );
  const textarea = (key: string, label: string) => (
    <label>
      {label}
      <textarea
        name={key}
        maxLength={2000}
        rows={3}
        value={draft[key]}
        onChange={(event) => update(key, event.target.value)}
      />
    </label>
  );
  return (
    <form
      action={submit}
      className="workspace-form"
      aria-busy={pending}
      onSubmit={() => setPending(true)}
    >
      <h2 id={title}>
        {deleting
          ? 'Confirmar eliminación'
          : selection.operation === 'edit'
            ? project
              ? 'Editar proyecto'
              : 'Editar cliente'
            : project
              ? 'Nuevo proyecto'
              : 'Nuevo cliente'}
      </h2>
      {deleting ? (
        <p>
          ¿Quieres eliminar «{item?.name}»? Esta acción no se puede deshacer.
        </p>
      ) : (
        <fieldset disabled={pending} className="workspace-fields">
          <legend className="workspace-sr-only">Datos del registro</legend>
          {input('name', 'Nombre', 160, 'text', true)}
          {project ? (
            <>
              <label>
                Cliente
                <select
                  name="client_id"
                  value={draft.client_id}
                  required
                  onChange={(event) => update('client_id', event.target.value)}
                >
                  <option value="">Selecciona un cliente</option>
                  {clients.map((client) => (
                    <option value={client.id} key={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select
                  name="status"
                  value={draft.status}
                  onChange={(event) => update('status', event.target.value)}
                >
                  {PROJECT_STATUSES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {textarea('description', 'Descripción')}
            </>
          ) : (
            <>
              {input('email', 'Correo electrónico', 254, 'email')}
              {input('phone', 'Teléfono', 60, 'tel')}
              {input('company', 'Empresa', 160)}
              {textarea('notes', 'Notas')}
            </>
          )}
        </fieldset>
      )}
      {result && !result.ok && (
        <p className="workspace-alert" role="alert">
          {result.message}
        </p>
      )}
      <div className="workspace-buttons">
        <button
          type="button"
          className="workspace-button"
          onClick={onCancel}
          disabled={pending}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={`workspace-button ${deleting ? 'workspace-danger' : 'workspace-primary'}`}
          disabled={pending}
        >
          {pending
            ? deleting
              ? 'Eliminando…'
              : 'Guardando…'
            : deleting
              ? 'Eliminar'
              : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

export function WorkspaceManagement({
  kind,
  items,
  clients = [],
}: {
  kind: Kind;
  items: Item[];
  clients?: ClientOption[];
}) {
  const project = kind === 'projects';
  const [selection, setSelection] = useState<Selection | null>(null);
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const pendingRef = useRef(false);
  const fallbackFocus = useRef<HTMLButtonElement>(null);
  const title = useId();
  const names = new Map(clients.map((client) => [client.id, client.name]));
  const labels = new Map(PROJECT_STATUSES);
  function open(next: Selection) {
    setNotice('');
    setSelection(next);
  }
  useEffect(() => {
    const modal = dialog.current;
    if (!selection || !modal || modal.open) return;
    modal.showModal();
    modal
      .querySelector<HTMLElement>(
        selection.operation === 'delete'
          ? 'button[type="button"]'
          : 'input[name="name"]',
      )
      ?.focus();
  }, [selection]);
  function close() {
    dialog.current?.close();
  }
  return (
    <>
      <div className="workspace-toolbar">
        <button
          type="button"
          className="workspace-button workspace-primary"
          ref={fallbackFocus}
          disabled={project && !clients.length}
          onClick={() => open({ operation: 'create' })}
        >
          {project ? 'Nuevo proyecto' : 'Nuevo cliente'}
        </button>
      </div>
      <div role="status" className={notice ? 'workspace-notice' : undefined}>
        {notice}
      </div>
      {project && !clients.length && (
        <p className="workspace-empty">
          Crea un cliente antes de añadir un proyecto.{' '}
          <Link href="/clientes">Ir a Clientes</Link>
        </p>
      )}
      {items.length ? (
        <ul
          className="workspace-list"
          aria-label={project ? 'Lista de proyectos' : 'Lista de clientes'}
        >
          {items.map((item) => (
            <li key={item.id} className="section-card workspace-record">
              <div className="workspace-record-copy">
                <h2>{item.name}</h2>
                {'client_id' in item ? (
                  <>
                    <dl className="workspace-details">
                      <div>
                        <dt>Cliente</dt>
                        <dd>
                          {names.get(item.client_id) ?? 'Cliente no disponible'}
                        </dd>
                      </div>
                      <div>
                        <dt>Estado</dt>
                        <dd>
                          <span className="workspace-chip">
                            {labels.get(item.status)}
                          </span>
                        </dd>
                      </div>
                    </dl>
                    {item.description && (
                      <p className="workspace-record-notes">
                        {item.description}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <dl className="workspace-details">
                      {item.company && (
                        <div>
                          <dt>Empresa</dt>
                          <dd>{item.company}</dd>
                        </div>
                      )}
                      {item.email && (
                        <div>
                          <dt>Correo electrónico</dt>
                          <dd>{item.email}</dd>
                        </div>
                      )}
                      {item.phone && (
                        <div>
                          <dt>Teléfono</dt>
                          <dd>{item.phone}</dd>
                        </div>
                      )}
                    </dl>
                    {item.notes && (
                      <p className="workspace-record-notes">{item.notes}</p>
                    )}
                  </>
                )}
              </div>
              <div className="workspace-buttons">
                <button
                  type="button"
                  className="workspace-button"
                  aria-label={`Editar ${item.name}`}
                  onClick={() => open({ operation: 'edit', item })}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="workspace-button"
                  aria-label={`Eliminar ${item.name}`}
                  onClick={() => open({ operation: 'delete', item })}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        (!project || clients.length > 0) && (
          <p className="workspace-empty">
            {project
              ? 'Todavía no tienes proyectos.'
              : 'Todavía no tienes clientes.'}
          </p>
        )
      )}
      <dialog
        ref={dialog}
        className="workspace-dialog"
        aria-labelledby={title}
        onClose={() => {
          setSelection(null);
          if (document.activeElement === document.body)
            fallbackFocus.current?.focus();
        }}
        onCancel={(event) => {
          if (pendingRef.current) event.preventDefault();
        }}
      >
        {selection && (
          <MutationForm
            kind={kind}
            selection={selection}
            clients={clients}
            title={title}
            setPending={(value) => {
              pendingRef.current = value;
            }}
            onCancel={close}
            onSuccess={(message) => {
              setNotice(message);
              close();
            }}
          />
        )}
      </dialog>
    </>
  );
}
