export type IconName =
  | 'dashboard'
  | 'clients'
  | 'projects'
  | 'arrow'
  | 'database'
  | 'shield'
  | 'layers';

const paths: Record<IconName, string[]> = {
  dashboard: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
  clients: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M16 3a4 4 0 0 1 0 8',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  ],
  projects: [
    'M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    'M3 11h18',
  ],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
  database: [
    'M20 5c0 2-4 3-8 3S4 7 4 5s4-3 8-3 8 1 8 3',
    'M4 5v14c0 2 4 3 8 3s8-1 8-3V5',
    'M4 12c0 2 4 3 8 3s8-1 8-3',
  ],
  shield: ['m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z', 'm8 12 3 3 5-6'],
  layers: ['m12 3 10 6-10 6L2 9z', 'm2 15 10 6 10-6', 'm2 12 10 6 10-6'],
};

export function Icon({
  name,
  className = '',
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
