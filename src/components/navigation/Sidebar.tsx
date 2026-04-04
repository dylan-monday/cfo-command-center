'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';

interface NavItem {
  href: string;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/chat', label: 'Chat' },
  { href: '/strategies', label: 'Strategies' },
  { href: '/documents', label: 'Documents' },
  { href: '/knowledge', label: 'Knowledge' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-border bg-surface h-full flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/" className="block">
          <h1 className="page-title text-lg">DiBona Financial</h1>
          <p className="text-text-muted text-xs mt-0.5">CFO Command Center</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="section-label px-3 py-2">Navigation</div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-md text-sm
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-accent-light text-accent font-medium'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text'
                    }
                  `}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="font-data text-xs bg-danger text-white px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <motion.div
          className="px-3 py-2 text-xs text-text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="font-data">v0.1.0</div>
        </motion.div>
      </div>
    </aside>
  );
}
