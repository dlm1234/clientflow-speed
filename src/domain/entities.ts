/** Opaque identifiers prevent accidentally mixing entity references at compile time. */
export type EntityId<Entity extends string> = string & {
  readonly __entity: Entity;
};

export type UserId = EntityId<'user'>;
export type ClientId = EntityId<'client'>;
export type ProjectId = EntityId<'project'>;

export interface ClientReference {
  readonly id: ClientId;
  readonly ownerId: UserId;
}

export interface ProjectReference {
  readonly id: ProjectId;
  readonly ownerId: UserId;
  readonly clientId: ClientId;
}

export const PROJECT_STATUSES = [
  ['planned', 'Planificado'],
  ['in_progress', 'En curso'],
  ['completed', 'Completado'],
  ['cancelled', 'Cancelado'],
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number][0];

export interface ClientRow {
  id: ClientId;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
}

export type ClientOption = Pick<ClientRow, 'id' | 'name'>;

export interface ProjectRow {
  id: ProjectId;
  name: string;
  description: string | null;
  client_id: ClientId;
  status: ProjectStatus;
}
