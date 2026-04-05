'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  MessageSquare,
  Target,
  FileText,
  Brain,
  Settings,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/strategies', label: 'Strategies', icon: Target },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/knowledge', label: 'Knowledge', icon: Brain },
];

const bottomNavItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = item.href === '/'
      ? pathname === '/'
      : pathname.startsWith(item.href);
    const Icon = item.icon;

    return (
      <motion.li
        key={item.href}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 + 0.1 }}
      >
        <Link
          href={item.href}
          className={`
            nav-item
            ${isActive ? 'nav-item-active' : ''}
          `}
        >
          <span className="icon-wrapper">
            <Icon className="w-5 h-5" />
          </span>
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="text-xs font-semibold bg-danger text-white px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
      </motion.li>
    );
  };

  return (
    <aside className="w-64 bg-surface border-r border-border h-full flex flex-col">
      {/* Logo */}
      <motion.div
        className="p-5 border-b border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/" className="block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-lg font-bold text-white">D</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-text">DiBona</h1>
                <span className="w-1.5 h-1.5 rounded-full bg-success" title="Connected" />
              </div>
              <p className="text-xs text-text-muted">CFO Command Center</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="section-label px-4 py-2 mb-1">Menu</div>
        <ul className="space-y-1">
          {navItems.map((item, index) => renderNavItem(item, index))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-border">
        <ul className="space-y-1">
          {bottomNavItems.map((item, index) => renderNavItem(item, index + navItems.length))}
        </ul>
        <motion.div
          className="mt-4 px-4 py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-xs text-text-muted">
            <span className="font-data">v0.1.0</span>
          </div>
        </motion.div>
      </div>
    </aside>
  );
}
