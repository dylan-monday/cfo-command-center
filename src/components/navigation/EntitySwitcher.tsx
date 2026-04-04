'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EntityDot } from '@/components/ui';

interface Entity {
  id: string;
  slug: string;
  name: string;
  type: string;
}

interface EntitySwitcherProps {
  selectedEntity?: string | null;
  onSelect: (slug: string | null) => void;
}

export function EntitySwitcher({ selectedEntity, onSelect }: EntitySwitcherProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntities() {
      try {
        const res = await fetch('/api/entities');
        const data = await res.json();
        setEntities(data.entities || []);
      } catch (error) {
        console.error('Failed to fetch entities:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEntities();
  }, []);

  const selected = entities.find((e) => e.slug === selectedEntity);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-surface hover:bg-surface-hover transition-colors"
      >
        {selected ? (
          <>
            <EntityDot slug={selected.slug} />
            <span className="flex-1 text-left text-sm">{selected.name}</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded bg-text-muted opacity-40" />
            <span className="flex-1 text-left text-sm text-text-secondary">All Entities</span>
          </>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-lg z-50 overflow-hidden"
          >
            {/* All entities option */}
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-surface-hover transition-colors ${
                !selectedEntity ? 'bg-accent-light text-accent' : ''
              }`}
            >
              <span className="w-2 h-2 rounded bg-text-muted opacity-40" />
              <span>All Entities</span>
            </button>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Entity list */}
            {loading ? (
              <div className="px-3 py-2 text-xs text-text-muted">Loading...</div>
            ) : (
              entities.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => {
                    onSelect(entity.slug);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-surface-hover transition-colors ${
                    selectedEntity === entity.slug ? 'bg-accent-light text-accent' : ''
                  }`}
                >
                  <EntityDot slug={entity.slug} />
                  <span className="flex-1">{entity.name}</span>
                  <span className="text-xs text-text-muted font-data">{entity.type}</span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
