'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, EntityDot, SkeletonCard } from '@/components/ui';
import { ChevronDown, ChevronRight, Building2, Wallet, Target, AlertCircle, ClipboardCheck } from 'lucide-react';

// Property entities that get the Property Review quick action
const PROPERTY_ENTITIES = ['got', 'saratoga', 'nice', 'chippewa', 'hvr'];

interface Account {
  id: string;
  name: string;
  type: string;
  institution: string;
  last4?: string;
}

interface EntityWithDetails {
  id: string;
  slug: string;
  name: string;
  type: string;
  tax_treatment: string;
  color: string;
  notes?: string;
  _counts: {
    accounts: number;
    strategies: number;
    openAlerts: number;
  };
  _accounts?: Account[];
}

export function EntityGrid() {
  const router = useRouter();
  const [entities, setEntities] = useState<EntityWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  // Start a property review chat
  const startPropertyReview = (entity: EntityWithDetails) => {
    // Store the review context in sessionStorage for the chat page to pick up
    sessionStorage.setItem('propertyReviewContext', JSON.stringify({
      entitySlug: entity.slug,
      entityName: entity.name,
      prompt: `Run a monthly review for ${entity.name}. Check all open items, flag anything that needs attention, and tell me what documents you need from me.`
    }));
    router.push(`/chat?entity=${entity.slug}`);
  };

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

  const toggleExpand = async (entity: EntityWithDetails) => {
    if (expandedId === entity.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(entity.id);

    // Fetch detailed data if not already loaded
    if (!entity._accounts) {
      setLoadingDetails(entity.id);
      try {
        const res = await fetch(`/api/entities?slug=${entity.slug}&includeAccounts=true`);
        const data = await res.json();

        setEntities((prev) =>
          prev.map((e) =>
            e.id === entity.id
              ? { ...e, _accounts: data.accounts || [] }
              : e
          )
        );
      } catch (error) {
        console.error('Failed to fetch entity details:', error);
      } finally {
        setLoadingDetails(null);
      }
    }
  };

  const typeLabels: Record<string, string> = {
    's-corp': 'S-Corp',
    partnership: 'Partnership',
    personal: 'Personal',
    'rental-property': 'Rental Property',
    'primary-residence': 'Primary Residence',
    'foreign-property': 'Foreign Property',
    'vacant-land': 'Vacant Land',
  };

  const accountTypeLabels: Record<string, string> = {
    checking: 'Checking',
    savings: 'Savings',
    credit: 'Credit Card',
    brokerage: 'Brokerage',
    retirement: 'Retirement',
    mortgage: 'Mortgage',
    '529': '529 Plan',
  };

  if (loading) {
    return (
      <Card animate={false}>
        <CardHeader
          label="Entity Map"
          title="Your Entities"
          action={<Building2 className="w-5 h-5 text-text-muted" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </Card>
    );
  }

  if (entities.length === 0) {
    return (
      <Card>
        <CardHeader
          label="Entity Map"
          title="Your Entities"
          action={<Building2 className="w-5 h-5 text-text-muted" />}
        />
        <div className="text-center py-8">
          <Building2 className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No entities found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        label="Entity Map"
        title={`${entities.length} Entities`}
        action={<Building2 className="w-5 h-5 text-accent" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entities.map((entity, index) => {
          const isExpanded = expandedId === entity.id;
          const isLoadingThis = loadingDetails === entity.id;

          return (
            <motion.div
              key={entity.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <div
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isExpanded
                    ? 'border-accent/30 bg-accent-light/20'
                    : 'border-border hover:border-border-active hover:bg-surface-hover'
                }`}
                onClick={() => toggleExpand(entity)}
              >
                {/* Header row */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `color-mix(in srgb, var(--entity-${entity.slug}) 15%, transparent)`,
                    }}
                  >
                    <EntityDot slug={entity.slug} size="lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">{entity.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {typeLabels[entity.type] || entity.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entity._counts.openAlerts > 0 && (
                      <span className="flex items-center gap-1 text-xs text-danger">
                        <AlertCircle className="w-3 h-3" />
                        {entity._counts.openAlerts}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-accent" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-sm font-data font-medium">{entity._counts.accounts}</span>
                    <span className="text-xs text-text-muted">accounts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-sm font-data font-medium">{entity._counts.strategies}</span>
                    <span className="text-xs text-text-muted">strategies</span>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="pt-4 mt-3 border-t border-border space-y-4">
                        {/* Tax treatment */}
                        <div>
                          <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                            Tax Treatment
                          </span>
                          <p className="text-sm text-text mt-1">{entity.tax_treatment}</p>
                        </div>

                        {/* Notes */}
                        {entity.notes && (
                          <div>
                            <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                              Notes
                            </span>
                            <p className="text-sm text-text-secondary mt-1">{entity.notes}</p>
                          </div>
                        )}

                        {/* Property Review quick action */}
                        {PROPERTY_ENTITIES.includes(entity.slug) && (
                          <div>
                            <button
                              onClick={() => startPropertyReview(entity)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors shadow-sm"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                              Run Property Review
                            </button>
                          </div>
                        )}

                        {/* Accounts list */}
                        <div>
                          <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                            Accounts ({entity._counts.accounts})
                          </span>
                          {isLoadingThis ? (
                            <div className="mt-2 space-y-2">
                              {[1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="h-10 bg-surface-alt rounded-lg animate-pulse"
                                />
                              ))}
                            </div>
                          ) : entity._accounts && entity._accounts.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {entity._accounts.map((account) => (
                                <div
                                  key={account.id}
                                  className="flex items-center justify-between p-2 bg-surface-alt rounded-lg"
                                >
                                  <div>
                                    <span className="text-sm font-medium">{account.name}</span>
                                    <span className="text-xs text-text-muted ml-2">
                                      {accountTypeLabels[account.type] || account.type}
                                    </span>
                                  </div>
                                  <div className="text-xs text-text-muted font-data">
                                    {account.institution}
                                    {account.last4 && ` ••${account.last4}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-text-muted mt-2">No accounts</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
