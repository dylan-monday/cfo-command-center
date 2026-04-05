'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, EntityBadge, SkeletonList } from '@/components/ui';
import { BookOpen, ChevronRight, Search, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import type { KnowledgeCategory, KnowledgeConfidence } from '@/types';

interface KnowledgeFact {
  id: string;
  category: KnowledgeCategory;
  key: string;
  value: string;
  source: string;
  confidence: KnowledgeConfidence;
  entities?: { slug: string; name: string } | null;
  created_at: string;
  verified_at: string | null;
}

interface KnowledgePanelProps {
  entitySlug?: string | null;
  category?: KnowledgeCategory;
  limit?: number;
}

const categoryLabels: Record<KnowledgeCategory, string> = {
  tax: 'Tax',
  financial: 'Financial',
  personal: 'Personal',
  strategy: 'Strategy',
  cpa: 'CPA',
  legal: 'Legal',
  property: 'Property',
  goals: 'Goals',
};

const confidenceIcons: Record<KnowledgeConfidence, { icon: typeof CheckCircle2; class: string }> = {
  confirmed: { icon: CheckCircle2, class: 'text-success' },
  inferred: { icon: HelpCircle, class: 'text-warning' },
  stale: { icon: AlertCircle, class: 'text-danger' },
};

export function KnowledgePanel({ entitySlug, category, limit = 12 }: KnowledgePanelProps) {
  const [facts, setFacts] = useState<KnowledgeFact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>(
    category || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchFacts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (entitySlug) params.set('entity', entitySlug);
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        if (searchQuery) params.set('search', searchQuery);
        params.set('limit', limit.toString());

        const res = await fetch(`/api/knowledge?${params}`);
        const data = await res.json();
        setFacts(data.facts || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error('Failed to fetch knowledge:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFacts();
  }, [entitySlug, selectedCategory, searchQuery, limit]);

  // Group facts by category for display
  const groupedFacts = facts.reduce((acc, fact) => {
    if (!acc[fact.category]) {
      acc[fact.category] = [];
    }
    acc[fact.category].push(fact);
    return acc;
  }, {} as Record<string, KnowledgeFact[]>);

  const categories = Object.keys(categoryLabels) as KnowledgeCategory[];

  return (
    <Card>
      <CardHeader
        label="Knowledge Base"
        title={`${total} Facts`}
        action={<BookOpen className="w-5 h-5 text-accent" />}
      />

      {/* Search and filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search facts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2 py-1 text-[10px] font-data uppercase tracking-wider rounded transition-colors ${
              selectedCategory === 'all'
                ? 'bg-accent text-white'
                : 'bg-surface-alt text-text-muted hover:text-text'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 text-[10px] font-data uppercase tracking-wider rounded transition-colors ${
                selectedCategory === cat
                  ? 'bg-accent text-white'
                  : 'bg-surface-alt text-text-muted hover:text-text'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Facts list */}
      {loading ? (
        <SkeletonList rows={6} />
      ) : facts.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-muted text-sm">
            {searchQuery ? 'No facts match your search' : 'No facts found'}
          </p>
        </div>
      ) : selectedCategory === 'all' ? (
        // Grouped view
        <div className="space-y-6">
          {Object.entries(groupedFacts).map(([cat, catFacts]) => (
            <div key={cat}>
              <h3 className="text-[10px] font-data uppercase tracking-wider text-text-muted mb-2">
                {categoryLabels[cat as KnowledgeCategory]} ({catFacts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <AnimatePresence mode="popLayout">
                  {catFacts.slice(0, 6).map((fact, index) => (
                    <FactItem key={fact.id} fact={fact} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat view for single category
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {facts.map((fact, index) => (
              <FactItem key={fact.id} fact={fact} index={index} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* View all link */}
      {total > limit && (
        <div className="mt-4 pt-4 border-t border-border text-center">
          <button className="text-sm text-accent hover:underline flex items-center gap-1 mx-auto">
            View all {total} facts
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </Card>
  );
}

function FactItem({ fact, index }: { fact: KnowledgeFact; index: number }) {
  const ConfidenceIcon = confidenceIcons[fact.confidence].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ delay: index * 0.02 }}
      className="p-3 rounded-lg border border-border hover:border-border-active hover:bg-surface-hover transition-all group"
    >
      <div className="flex items-start gap-2">
        <ConfidenceIcon
          className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${confidenceIcons[fact.confidence].class}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-data text-text-muted">{fact.key}</span>
            {fact.entities && (
              <EntityBadge slug={fact.entities.slug} name={fact.entities.name} />
            )}
          </div>
          <p className="text-sm text-text mt-1 truncate" title={fact.value}>
            {fact.value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
