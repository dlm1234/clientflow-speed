export function DataHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">TU ESPACIO, EN ORDEN</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
    </div>
  );
}

export function DataError({ href }: { href: string }) {
  return (
    <div className="workspace-alert" role="alert">
      <p>No se pudieron consultar los registros. Inténtalo de nuevo.</p>
      <a href={href}>Volver a intentar</a>
    </div>
  );
}
