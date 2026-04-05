'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, EntityBadge, SkeletonList } from '@/components/ui';
import { BookOpen, Search, CheckCircle2, AlertCircle, HelpCircle, Plus, ChevronDown, ChevronRight } from 'lucide-react';
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

interface Entity {
  slug: string;
  name: string;
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

const confidenceConfig: Record<KnowledgeConfidence, { icon: typeof CheckCircle2; class: string; label: string }> = {
  confirmed: { icon: CheckCircle2, class: 'text-success', label: 'Confirmed' },
  inferred: { icon: HelpCircle, class: 'text-warning', label: 'Inferred' },
  stale: { icon: AlertCircle, class: 'text-danger', label: 'Stale' },
};

export default function KnowledgePage() {
  const [facts, setFacts] = useState<KnowledgeFact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<Entity[]>([]);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeStale, setIncludeStale] = useState(false);

  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch entities
  useEffect(() => {
    async function fetchEntities() {
      try {
        const res = await fetch('/api/entities');
        const data = await res.json();
        setEntities(data.entities || []);
      } catch (error) {
        console.error('Failed to fetch entities:', error);
      }
    }
    fetchEntities();
  }, []);

  // Fetch facts
  const fetchFacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedEntity !== 'all') params.set('entity', selectedEntity);
      if (searchQuery) params.set('search', searchQuery);
      if (includeStale) params.set('includeStale', 'true');
      params.set('limit', '500');

      const res = await fetch(`/api/knowledge?${params}`);
      const data = await res.json();
      setFacts(data.facts || []);
      setTotal(data.total || 0);

      // Expand all categories by default
      const categories = new Set<string>(data.facts?.map((f: KnowledgeFact) => f.category) || []);
      setExpandedCategories(categories);
    } catch (error) {
      console.error('Failed to fetch knowledge:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedEntity, searchQuery, includeStale]);

  useEffect(() => {
    fetchFacts();
  }, [fetchFacts]);

  // Group facts by category
  const groupedFacts = facts.reduce((acc, fact) => {
    if (!acc[fact.category]) {
      acc[fact.category] = [];
    }
    acc[fact.category].push(fact);
    return acc;
  }, {} as Record<string, KnowledgeFact[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const categories = Object.keys(categoryLabels) as KnowledgeCategory[];

  // Stats
  const stats = {
    total: facts.length,
    confirmed: facts.filter((f) => f.confidence === 'confirmed').length,
    inferred: facts.filter((f) => f.confidence === 'inferred').length,
    stale: facts.filter((f) => f.confidence === 'stale').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">Knowledge Base</h1>
        <p className="text-text-secondary mt-2">
          All facts and information the system knows about your finances
        </p>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <div className="p-4 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-3 h-3 text-accent" />
            <span className="text-xs text-text-muted font-data uppercase tracking-wider">Total Facts</span>
          </div>
          <span className="text-2xl font-semibold font-data">{stats.total}</span>
        </div>
        <div className="p-4 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-3 h-3 text-success" />
            <span className="text-xs text-text-muted font-data uppercase tracking-wider">Confirmed</span>
          </div>
          <span className="text-2xl font-semibold font-data text-success">{stats.confirmed}</span>
        </div>
        <div className="p-4 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-3 h-3 text-warning" />
            <span className="text-xs text-text-muted font-data uppercase tracking-wider">Inferred</span>
          </div>
          <span className="text-2xl font-semibold font-data text-warning">{stats.inferred}</span>
        </div>
        <div className="p-4 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-3 h-3 text-danger" />
            <span className="text-xs text-text-muted font-data uppercase tracking-wider">Stale</span>
          </div>
          <span className="text-2xl font-semibold font-data text-danger">{stats.stale}</span>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search facts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as KnowledgeCategory | 'all')}
          className="px-3 py-2 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {categoryLabels[cat]}
            </option>
          ))}
        </select>

        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="px-3 py-2 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
        >
          <option value="all">All Entities</option>
          {entities.map((entity) => (
            <option key={entity.slug} value={entity.slug}>
              {entity.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeStale}
            onChange={(e) => setIncludeStale(e.target.checked)}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-secondary">Include stale</span>
        </label>

        {(selectedCategory !== 'all' || selectedEntity !== 'all' || searchQuery || includeStale) && (
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedEntity('all');
              setSearchQuery('');
              setIncludeStale(false);
            }}
            className="text-xs text-accent hover:underline"
          >
            Clear filters
          </button>
        )}
      </motion.div>

      {/* Facts list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card animate={false}>
          <CardHeader
            label="Knowledge Base"
            title={`${total} Facts`}
            action={
              <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Add Fact
              </button>
            }
          />

          {loading ? (
            <SkeletonList rows={10} />
          ) : facts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No facts found</p>
              <p className="text-text-muted text-sm mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Knowledge base is empty'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedFacts).map(([category, catFacts]) => (
                <div key={category} className="border border-border rounded-lg overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 bg-surface-alt hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      )}
                      <span className="text-sm font-semibold">
                        {categoryLabels[category as KnowledgeCategory]}
                      </span>
                      <span className="text-xs text-text-muted font-data">
                        ({catFacts.length})
                      </span>
                    </div>
                  </button>

                  {/* Category facts */}
                  <AnimatePresence>
                    {expandedCategories.has(category) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y divide-border">
                          {catFacts.map((fact) => {
                            const ConfidenceIcon = confidenceConfig[fact.confidence].icon;
                            return (
                              <div
                                key={fact.id}
                                className="p-3 hover:bg-surface-hover transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <span title={confidenceConfig[fact.confidence].label}>
                                    <ConfidenceIcon
                                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${confidenceConfig[fact.confidence].class}`}
                                    />
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-data font-medium text-text-muted">
                                        {fact.key}
                                      </span>
                                      {fact.entities && (
                                        <EntityBadge
                                          slug={fact.entities.slug}
                                          name={fact.entities.name}
                                        />
                                      )}
                                      <span className="text-[10px] font-data text-text-faint">
                                        via {fact.source}
                                      </span>
                                    </div>
                                    <p className="text-sm text-text mt-1">{fact.value}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
