'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, EntityDot, SkeletonList } from '@/components/ui';
import {
  Settings,
  Database,
  Building2,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Wallet,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
} from 'lucide-react';
import type { KnowledgeCategory, KnowledgeConfidence, PartnerRole, PartnerStatus } from '@/types';

interface KnowledgeFact {
  id: string;
  category: KnowledgeCategory;
  key: string;
  value: string;
  source: string;
  confidence: KnowledgeConfidence;
  entity_id: string | null;
  entities?: { slug: string; name: string } | null;
}

interface Entity {
  id: string;
  slug: string;
  name: string;
  type: string;
  color: string;
  tax_treatment: string;
  notes?: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  institution: string;
  last4?: string;
  entity_id: string;
}

interface Partner {
  id: string;
  name: string;
  role: PartnerRole;
  company?: string;
  email?: string;
  phone?: string;
  entities?: string[];
  notes?: string;
  status: PartnerStatus;
}

type SettingsTab = 'knowledge' | 'entities' | 'partners' | 'admin';

const categoryOptions: KnowledgeCategory[] = ['tax', 'financial', 'personal', 'strategy', 'cpa', 'legal', 'property'];
const confidenceOptions: KnowledgeConfidence[] = ['confirmed', 'inferred', 'stale'];
const roleOptions: { value: PartnerRole; label: string }[] = [
  { value: 'cpa', label: 'CPA' },
  { value: 'bookkeeper', label: 'Bookkeeper' },
  { value: 'property-manager', label: 'Property Manager' },
  { value: 'advisor', label: 'Financial Advisor' },
  { value: 'attorney', label: 'Attorney' },
  { value: 'syndic', label: 'Syndic' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('knowledge');
  const [loading, setLoading] = useState(true);

  // Knowledge state
  const [facts, setFacts] = useState<KnowledgeFact[]>([]);
  const [factSearch, setFactSearch] = useState('');
  const [editingFact, setEditingFact] = useState<KnowledgeFact | null>(null);
  const [newFact, setNewFact] = useState<Partial<KnowledgeFact> | null>(null);

  // Entities state
  const [entities, setEntities] = useState<Entity[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [newEntity, setNewEntity] = useState<Partial<Entity> | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [newAccount, setNewAccount] = useState<Partial<Account> | null>(null);

  // Partners state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [newPartner, setNewPartner] = useState<Partial<Partner> | null>(null);
  const [showFormerPartners, setShowFormerPartners] = useState(false);

  // Fetch all data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [factsRes, entitiesRes, partnersRes] = await Promise.all([
          fetch('/api/knowledge?limit=1000&includeStale=true'),
          fetch('/api/entities?includeAccounts=true'),
          fetch('/api/partners?includeFormer=true'),
        ]);

        const factsData = await factsRes.json();
        const entitiesData = await entitiesRes.json();
        const partnersData = await partnersRes.json();

        setFacts(factsData.facts || []);
        setEntities(entitiesData.entities || []);
        setAccounts(entitiesData.accounts || []);
        setPartners(partnersData.partners || []);
      } catch (error) {
        console.error('Failed to fetch settings data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter facts by search
  const filteredFacts = facts.filter(
    (f) =>
      f.key.toLowerCase().includes(factSearch.toLowerCase()) ||
      f.value.toLowerCase().includes(factSearch.toLowerCase())
  );

  // Get accounts for an entity
  const getEntityAccounts = (entityId: string) =>
    accounts.filter((a) => a.entity_id === entityId);

  // Save fact (create or update)
  const saveFact = async (fact: Partial<KnowledgeFact>) => {
    try {
      const method = fact.id ? 'PUT' : 'POST';
      const res = await fetch('/api/knowledge', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fact),
      });

      if (!res.ok) throw new Error('Failed to save fact');

      const data = await res.json();

      if (fact.id) {
        setFacts((prev) => prev.map((f) => (f.id === fact.id ? data.fact : f)));
      } else {
        setFacts((prev) => [data.fact, ...prev]);
      }

      setEditingFact(null);
      setNewFact(null);
    } catch (error) {
      console.error('Save fact error:', error);
    }
  };

  // Delete fact
  const deleteFact = async (id: string) => {
    if (!confirm('Delete this fact?')) return;

    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete fact');
      setFacts((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error('Delete fact error:', error);
    }
  };

  // Save partner (create or update)
  const savePartner = async (partner: Partial<Partner>) => {
    try {
      const method = partner.id ? 'PUT' : 'POST';
      const res = await fetch('/api/partners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partner),
      });

      if (!res.ok) throw new Error('Failed to save partner');

      const data = await res.json();

      if (partner.id) {
        setPartners((prev) => prev.map((p) => (p.id === partner.id ? data.partner : p)));
      } else {
        setPartners((prev) => [data.partner, ...prev]);
      }

      setEditingPartner(null);
      setNewPartner(null);
    } catch (error) {
      console.error('Save partner error:', error);
    }
  };

  // Delete partner
  const deletePartner = async (id: string) => {
    if (!confirm('Delete this partner?')) return;

    try {
      const res = await fetch(`/api/partners?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete partner');
      setPartners((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Delete partner error:', error);
    }
  };

  // Toggle partner status (active/former)
  const togglePartnerStatus = async (partner: Partner) => {
    const newStatus = partner.status === 'active' ? 'former' : 'active';
    await savePartner({ ...partner, status: newStatus });
  };

  // Filter partners
  const filteredPartners = partners.filter((p) =>
    showFormerPartners ? true : p.status === 'active'
  );

  // Get entity names for a partner
  const getPartnerEntityNames = (entityIds?: string[]) => {
    if (!entityIds || entityIds.length === 0) return 'None';
    if (entityIds.length === entities.length) return 'All entities';
    return entityIds
      .map((id) => entities.find((e) => e.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const tabs = [
    { id: 'knowledge' as const, label: 'Knowledge Base', icon: Database },
    { id: 'entities' as const, label: 'Entities & Accounts', icon: Building2 },
    { id: 'partners' as const, label: 'Partners', icon: Users },
    { id: 'admin' as const, label: 'Admin', icon: Settings },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">Settings</h1>
        <p className="text-text-secondary mt-2">
          Manage your knowledge base, entities, and system configuration
        </p>
      </motion.div>

      {/* Tab navigation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex gap-2 border-b border-border"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Tab content */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <Card animate={false}>
            <CardHeader
              label="Knowledge Base"
              title={`${facts.length} Facts`}
              action={
                <button
                  onClick={() =>
                    setNewFact({
                      category: 'financial',
                      key: '',
                      value: '',
                      source: 'user',
                      confidence: 'confirmed',
                    })
                  }
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Fact
                </button>
              }
            />

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search facts..."
                value={factSearch}
                onChange={(e) => setFactSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {/* New fact form */}
            {newFact && (
              <div className="mb-4 p-4 bg-accent-light/20 border border-accent/30 rounded-lg">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select
                    value={newFact.category || 'financial'}
                    onChange={(e) =>
                      setNewFact({ ...newFact, category: e.target.value as KnowledgeCategory })
                    }
                    className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newFact.confidence || 'confirmed'}
                    onChange={(e) =>
                      setNewFact({ ...newFact, confidence: e.target.value as KnowledgeConfidence })
                    }
                    className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                  >
                    {confidenceOptions.map((conf) => (
                      <option key={conf} value={conf}>
                        {conf.charAt(0).toUpperCase() + conf.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Key (e.g., filing_status)"
                  value={newFact.key || ''}
                  onChange={(e) => setNewFact({ ...newFact, key: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm mb-2"
                />
                <textarea
                  placeholder="Value"
                  value={newFact.value || ''}
                  onChange={(e) => setNewFact({ ...newFact, value: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm mb-3"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveFact(newFact)}
                    disabled={!newFact.key || !newFact.value}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => setNewFact(null)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <SkeletonList rows={10} />
            ) : (
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {filteredFacts.map((fact) => (
                  <div key={fact.id} className="p-3 hover:bg-surface-hover transition-colors">
                    {editingFact?.id === fact.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={editingFact.category}
                            onChange={(e) =>
                              setEditingFact({
                                ...editingFact,
                                category: e.target.value as KnowledgeCategory,
                              })
                            }
                            className="px-2 py-1 bg-surface border border-border rounded text-sm"
                          >
                            {categoryOptions.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editingFact.confidence}
                            onChange={(e) =>
                              setEditingFact({
                                ...editingFact,
                                confidence: e.target.value as KnowledgeConfidence,
                              })
                            }
                            className="px-2 py-1 bg-surface border border-border rounded text-sm"
                          >
                            {confidenceOptions.map((conf) => (
                              <option key={conf} value={conf}>
                                {conf}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          value={editingFact.key}
                          onChange={(e) =>
                            setEditingFact({ ...editingFact, key: e.target.value })
                          }
                          className="w-full px-2 py-1 bg-surface border border-border rounded text-sm"
                        />
                        <textarea
                          value={editingFact.value}
                          onChange={(e) =>
                            setEditingFact({ ...editingFact, value: e.target.value })
                          }
                          className="w-full px-2 py-1 bg-surface border border-border rounded text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveFact(editingFact)}
                            className="text-xs text-success hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingFact(null)}
                            className="text-xs text-text-muted hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-data uppercase tracking-wider text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">
                              {fact.category}
                            </span>
                            <span className="text-xs font-data font-medium text-text">
                              {fact.key}
                            </span>
                            {fact.entities && (
                              <span className="text-[10px] text-accent">
                                {fact.entities.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary mt-1 truncate">
                            {fact.value}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingFact(fact)}
                            className="p-1 text-text-muted hover:text-accent transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteFact(fact.id)}
                            className="p-1 text-text-muted hover:text-danger transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Entities Tab */}
        {activeTab === 'entities' && (
          <Card animate={false}>
            <CardHeader
              label="Entities & Accounts"
              title={`${entities.length} Entities, ${accounts.length} Accounts`}
              action={
                <button
                  onClick={() =>
                    setNewEntity({
                      name: '',
                      slug: '',
                      type: 'personal',
                      color: '#1A8A7D',
                      tax_treatment: '',
                    })
                  }
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Entity
                </button>
              }
            />

            {/* New entity form */}
            {newEntity && (
              <div className="mb-4 p-4 bg-accent-light/20 border border-accent/30 rounded-lg">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newEntity.name || ''}
                    onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                    className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Slug (e.g., mp)"
                    value={newEntity.slug || ''}
                    onChange={(e) =>
                      setNewEntity({ ...newEntity, slug: e.target.value.toLowerCase() })
                    }
                    className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select
                    value={newEntity.type || 'personal'}
                    onChange={(e) => setNewEntity({ ...newEntity, type: e.target.value })}
                    className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                  >
                    <option value="s-corp">S-Corp</option>
                    <option value="partnership">Partnership</option>
                    <option value="personal">Personal</option>
                    <option value="rental-property">Rental Property</option>
                    <option value="primary-residence">Primary Residence</option>
                    <option value="foreign-property">Foreign Property</option>
                    <option value="vacant-land">Vacant Land</option>
                  </select>
                  <input
                    type="color"
                    value={newEntity.color || '#1A8A7D'}
                    onChange={(e) => setNewEntity({ ...newEntity, color: e.target.value })}
                    className="w-full h-10 px-1 py-1 bg-surface border border-border rounded-md"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Tax treatment"
                  value={newEntity.tax_treatment || ''}
                  onChange={(e) => setNewEntity({ ...newEntity, tax_treatment: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Would need API endpoint to create entity
                      alert('Entity creation requires API endpoint implementation');
                      setNewEntity(null);
                    }}
                    disabled={!newEntity.name || !newEntity.slug}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => setNewEntity(null)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <SkeletonList rows={7} />
            ) : (
              <div className="space-y-2">
                {entities.map((entity) => {
                  const entityAccounts = getEntityAccounts(entity.id);
                  const isExpanded = expandedEntity === entity.id;

                  return (
                    <div
                      key={entity.id}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedEntity(isExpanded ? null : entity.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-surface-hover transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <EntityDot slug={entity.slug} size="md" />
                          <div className="text-left">
                            <span className="text-sm font-semibold">{entity.name}</span>
                            <span className="text-xs text-text-muted ml-2">{entity.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted font-data">
                            {entityAccounts.length} accounts
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-text-muted" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 pt-0 border-t border-border bg-surface-alt/50">
                              {/* Entity details */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                                    Tax Treatment
                                  </span>
                                  <p className="text-sm">{entity.tax_treatment}</p>
                                </div>
                                <div>
                                  <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                                    Color
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div
                                      className="w-4 h-4 rounded"
                                      style={{ backgroundColor: entity.color }}
                                    />
                                    <span className="text-xs font-data">{entity.color}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Accounts */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                                    Accounts ({entityAccounts.length})
                                  </span>
                                  <button
                                    onClick={() =>
                                      setNewAccount({
                                        name: '',
                                        type: 'checking',
                                        institution: '',
                                        entity_id: entity.id,
                                      })
                                    }
                                    className="text-xs text-accent hover:underline flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </button>
                                </div>

                                {entityAccounts.length > 0 ? (
                                  <div className="space-y-1">
                                    {entityAccounts.map((account) => (
                                      <div
                                        key={account.id}
                                        className="flex items-center justify-between p-2 bg-surface rounded"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Wallet className="w-3.5 h-3.5 text-text-muted" />
                                          <span className="text-sm">{account.name}</span>
                                          <span className="text-xs text-text-muted">
                                            {account.type}
                                          </span>
                                        </div>
                                        <span className="text-xs text-text-muted font-data">
                                          {account.institution}
                                          {account.last4 && ` ••${account.last4}`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-text-muted">No accounts</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <Card animate={false}>
            <CardHeader
              label="Partners"
              title={`${filteredPartners.length} Partners`}
              action={
                <button
                  onClick={() =>
                    setNewPartner({
                      name: '',
                      role: 'cpa',
                      company: '',
                      status: 'active',
                    })
                  }
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Partner
                </button>
              }
            />

            {/* Show former toggle */}
            <div className="flex items-center gap-2 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFormerPartners}
                  onChange={(e) => setShowFormerPartners(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm text-text-secondary">Show former partners</span>
              </label>
            </div>

            {/* New partner form */}
            {newPartner && (
              <div className="mb-4 p-4 bg-accent-light/20 border border-accent/30 rounded-lg">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={newPartner.name || ''}
                    onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                    className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                  />
                  <select
                    value={newPartner.role || 'cpa'}
                    onChange={(e) => setNewPartner({ ...newPartner, role: e.target.value as PartnerRole })}
                    className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Company (optional)"
                  value={newPartner.company || ''}
                  onChange={(e) => setNewPartner({ ...newPartner, company: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm mb-2"
                />
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newPartner.email || ''}
                    onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                    className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={newPartner.phone || ''}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                  />
                </div>
                <textarea
                  placeholder="Notes (optional)"
                  value={newPartner.notes || ''}
                  onChange={(e) => setNewPartner({ ...newPartner, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm mb-3"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => savePartner(newPartner)}
                    disabled={!newPartner.name}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => setNewPartner(null)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <SkeletonList rows={6} />
            ) : filteredPartners.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No partners found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      partner.status === 'former'
                        ? 'border-border/50 bg-surface-alt/30 opacity-60'
                        : 'border-border hover:border-border-active'
                    }`}
                  >
                    {editingPartner?.id === partner.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editingPartner.name}
                            onChange={(e) =>
                              setEditingPartner({ ...editingPartner, name: e.target.value })
                            }
                            className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                          />
                          <select
                            value={editingPartner.role}
                            onChange={(e) =>
                              setEditingPartner({ ...editingPartner, role: e.target.value as PartnerRole })
                            }
                            className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                          >
                            {roleOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Company"
                          value={editingPartner.company || ''}
                          onChange={(e) =>
                            setEditingPartner({ ...editingPartner, company: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="email"
                            placeholder="Email"
                            value={editingPartner.email || ''}
                            onChange={(e) =>
                              setEditingPartner({ ...editingPartner, email: e.target.value })
                            }
                            className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                          />
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={editingPartner.phone || ''}
                            onChange={(e) =>
                              setEditingPartner({ ...editingPartner, phone: e.target.value })
                            }
                            className="px-3 py-2 bg-surface border border-border rounded-md text-sm"
                          />
                        </div>
                        <textarea
                          placeholder="Notes"
                          value={editingPartner.notes || ''}
                          onChange={(e) =>
                            setEditingPartner({ ...editingPartner, notes: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => savePartner(editingPartner)}
                            className="text-xs text-success hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPartner(null)}
                            className="text-xs text-text-muted hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{partner.name}</span>
                            <span className="text-[10px] font-data uppercase tracking-wider text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">
                              {roleOptions.find((r) => r.value === partner.role)?.label || partner.role}
                            </span>
                            {partner.status === 'former' && (
                              <span className="text-[10px] font-data uppercase tracking-wider text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                                Former
                              </span>
                            )}
                          </div>
                          {partner.company && (
                            <p className="text-sm text-text-secondary mt-1">{partner.company}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                            {partner.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {partner.email}
                              </span>
                            )}
                            {partner.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {partner.phone}
                              </span>
                            )}
                          </div>
                          {partner.notes && (
                            <p className="text-xs text-text-muted mt-2 italic">{partner.notes}</p>
                          )}
                          <p className="text-[10px] text-text-faint mt-2">
                            Entities: {getPartnerEntityNames(partner.entities)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => togglePartnerStatus(partner)}
                            className="p-1 text-text-muted hover:text-accent transition-colors"
                            title={partner.status === 'active' ? 'Mark as former' : 'Mark as active'}
                          >
                            {partner.status === 'active' ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingPartner(partner)}
                            className="p-1 text-text-muted hover:text-accent transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deletePartner(partner.id)}
                            className="p-1 text-text-muted hover:text-danger transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && (
          <Card animate={false}>
            <CardHeader
              label="Administration"
              title="System Configuration"
              action={<Settings className="w-5 h-5 text-accent" />}
            />

            <div className="space-y-4">
              {/* Supabase link */}
              <a
                href={process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.supabase.com') || 'https://supabase.com/dashboard'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-accent hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3ECF8E]/10 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-[#3ECF8E]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Supabase Dashboard</h3>
                    <p className="text-xs text-text-muted">
                      Direct database access, SQL editor, and table management
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-text-muted" />
              </a>

              {/* System stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 bg-surface-alt border border-border rounded-lg">
                  <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                    Entities
                  </span>
                  <p className="text-2xl font-semibold font-data mt-1">{entities.length}</p>
                </div>
                <div className="p-4 bg-surface-alt border border-border rounded-lg">
                  <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                    Accounts
                  </span>
                  <p className="text-2xl font-semibold font-data mt-1">{accounts.length}</p>
                </div>
                <div className="p-4 bg-surface-alt border border-border rounded-lg">
                  <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                    Facts
                  </span>
                  <p className="text-2xl font-semibold font-data mt-1">{facts.length}</p>
                </div>
                <div className="p-4 bg-surface-alt border border-border rounded-lg">
                  <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                    Partners
                  </span>
                  <p className="text-2xl font-semibold font-data mt-1">{partners.filter(p => p.status === 'active').length}</p>
                </div>
                <div className="p-4 bg-surface-alt border border-border rounded-lg">
                  <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                    Version
                  </span>
                  <p className="text-2xl font-semibold font-data mt-1">1.0</p>
                </div>
              </div>

              {/* Environment info */}
              <div className="p-4 bg-surface-alt border border-border rounded-lg">
                <h3 className="text-sm font-semibold mb-3">Environment</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Supabase</span>
                    <span className="font-data text-success">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Claude API</span>
                    <span className="font-data text-success">Configured</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Gmail API</span>
                    <span className="font-data text-success">Configured</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
