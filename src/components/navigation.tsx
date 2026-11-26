'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './icon';

const items: { href: string; label: string; icon: IconName }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/clientes', label: 'Clientes', icon: 'clients' },
  { href: '/proyectos', label: 'Proyectos', icon: 'projects' },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación principal" className="navigation">
      {items.map(({ href, label, icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? 'page' : undefined}
        >
          <Icon name={icon} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
