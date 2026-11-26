export function PageHeader({
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
      <span className="connection-badge">
        <span aria-hidden="true" />
        Sin conexión de datos
      </span>
    </div>
  );
}
