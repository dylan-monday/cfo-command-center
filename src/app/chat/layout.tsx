'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  FileText,
  Brain,
  Settings,
  MessageSquare,
  Plus,
  Menu,
  X,
} from 'lucide-react';

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/strategies', label: 'Strategies', icon: Target },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/knowledge', label: 'Knowledge', icon: Brain },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Extract conversation ID from URL
  const currentConversationId = pathname.startsWith('/chat/')
    ? pathname.replace('/chat/', '')
    : null;

  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch('/api/chat');
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, [pathname]); // Refetch when pathname changes

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleNewChat = () => {
    router.push('/chat');
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      {/* Left Panel - Nav + Conversations (280px) */}
      <aside className="hidden md:flex w-[280px] flex-col bg-surface border-r border-border flex-shrink-0">
        {/* Logo area */}
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-base font-bold text-text-on-gradient">D</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-semibold text-text">DiBona</span>
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
              </div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-mono">
                CFO Command Center
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 border-b border-border">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-accent-light text-accent font-medium'
                        : 'text-text-secondary hover:bg-surface-alt hover:text-text'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Conversations Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Conversations
          </span>
          <button
            onClick={handleNewChat}
            className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-surface-alt rounded-lg animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-xs text-text-muted">No conversations yet</p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((conv) => {
                const isActive = currentConversationId === conv.id;
                return (
                  <li key={conv.id}>
                    <Link
                      href={`/chat/${conv.id}`}
                      className={`block p-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-accent-light border-l-[3px] border-accent'
                          : 'hover:bg-surface-alt border-l-[3px] border-transparent'
                      }`}
                    >
                      <p className={`text-[13px] font-semibold truncate ${
                        isActive ? 'text-accent' : 'text-text'
                      }`}>
                        {conv.title || 'New conversation'}
                      </p>
                      <p className="text-[10px] font-mono text-text-muted mt-0.5">
                        {formatDate(conv.updated_at)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 text-text-secondary hover:text-text"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold text-text">CFO</span>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-surface z-50 md:hidden flex flex-col"
            >
              {/* Close button */}
              <div className="p-4 flex justify-end">
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-text-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav */}
              <nav className="px-3 pb-4 border-b border-border">
                <ul className="space-y-0.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-surface-alt"
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                    Conversations
                  </span>
                  <button
                    onClick={handleNewChat}
                    className="text-xs text-accent hover:text-accent-hover flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New
                  </button>
                </div>
                <ul className="px-2 space-y-0.5">
                  {conversations.map((conv) => {
                    const isActive = currentConversationId === conv.id;
                    return (
                      <li key={conv.id}>
                        <Link
                          href={`/chat/${conv.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block p-3 rounded-lg transition-all ${
                            isActive
                              ? 'bg-accent-light border-l-[3px] border-accent'
                              : 'hover:bg-surface-alt border-l-[3px] border-transparent'
                          }`}
                        >
                          <p className={`text-[13px] font-semibold truncate ${
                            isActive ? 'text-accent' : 'text-text'
                          }`}>
                            {conv.title || 'New conversation'}
                          </p>
                          <p className="text-[10px] font-mono text-text-muted mt-0.5">
                            {formatDate(conv.updated_at)}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Right Panel - Chat Area */}
      <main className="flex-1 flex flex-col overflow-hidden md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
