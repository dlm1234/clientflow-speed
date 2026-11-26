import { Icon, type IconName } from './icon';

export function DisconnectedState({
  icon,
  title,
  description,
  note,
}: {
  icon: IconName;
  title: string;
  description: string;
  note: string;
}) {
  return (
    <section
      className="disconnected-state"
      aria-labelledby="disconnected-title"
    >
      <div className="empty-art" aria-hidden="true">
        <span className="art-orbit" />
        <span className="art-dot" />
        <span className="art-card art-card-back" />
        <span className="art-card art-card-front">
          <Icon name={icon} />
          <span />
          <span />
        </span>
      </div>
      <span className="section-kicker">ESPACIO PREPARADO</span>
      <h2 id="disconnected-title">{title}</h2>
      <p>{description}</p>
      <div className="empty-note">
        <Icon name="database" />
        <span>{note}</span>
      </div>
    </section>
  );
}
