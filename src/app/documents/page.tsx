'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, EntityBadge, SkeletonList } from '@/components/ui';
import {
  FileText,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Receipt,
  Building,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import type { DocumentType, DocumentStatus } from '@/types';

interface Document {
  id: string;
  filename: string;
  doc_type: DocumentType;
  doc_subtype: string | null;
  source: string | null;
  status: DocumentStatus;
  ai_summary: string | null;
  key_figures: Record<string, number> | null;
  tax_year: number | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  entities?: { slug: string; name: string } | null;
  accounts?: { name: string } | null;
}

interface Entity {
  slug: string;
  name: string;
}

const docTypeLabels: Record<DocumentType, { label: string; icon: typeof FileText }> = {
  'bank-statement': { label: 'Bank Statement', icon: FileSpreadsheet },
  'brokerage-statement': { label: 'Brokerage Statement', icon: FileSpreadsheet },
  'retirement-statement': { label: 'Retirement Statement', icon: FileSpreadsheet },
  'tax-document': { label: 'Tax Document', icon: Receipt },
  insurance: { label: 'Insurance', icon: FileText },
  'property-report': { label: 'Property Report', icon: Building },
  invoice: { label: 'Invoice', icon: Receipt },
  receipt: { label: 'Receipt', icon: Receipt },
  '529-statement': { label: '529 Statement', icon: FileSpreadsheet },
  'option-grant': { label: 'Option Grant', icon: FileText },
  k1: { label: 'K-1', icon: Receipt },
  w2: { label: 'W-2', icon: Receipt },
  '1099': { label: '1099', icon: Receipt },
  'pm-report': { label: 'PM Report', icon: Building },
  other: { label: 'Other', icon: FileText },
};

const statusConfig: Record<DocumentStatus, { icon: typeof Clock; class: string; label: string }> = {
  processing: { icon: Clock, class: 'text-warning', label: 'Processing' },
  parsed: { icon: CheckCircle2, class: 'text-accent', label: 'Parsed' },
  confirmed: { icon: CheckCircle2, class: 'text-success', label: 'Confirmed' },
  error: { icon: AlertCircle, class: 'text-danger', label: 'Error' },
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded document
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedEntity !== 'all') params.set('entity', selectedEntity);
      if (selectedType !== 'all') params.set('type', selectedType);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      params.set('limit', '100');

      const res = await fetch(`/api/parse?${params}`);
      const data = await res.json();

      let docs = data.documents || [];

      // Client-side search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        docs = docs.filter(
          (d: Document) =>
            d.filename.toLowerCase().includes(query) ||
            d.ai_summary?.toLowerCase().includes(query) ||
            d.doc_type.toLowerCase().includes(query)
        );
      }

      setDocuments(docs);
      setTotal(data.total || docs.length);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedEntity, selectedType, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedEntity !== 'all') {
        formData.append('entityHint', selectedEntity);
      }

      const res = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Refresh documents list
      await fetchDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const docTypes = Object.keys(docTypeLabels) as DocumentType[];

  // Stats
  const stats = {
    total: documents.length,
    confirmed: documents.filter((d) => d.status === 'confirmed').length,
    parsed: documents.filter((d) => d.status === 'parsed').length,
    processing: documents.filter((d) => d.status === 'processing').length,
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="text-text-secondary mt-2">
            Upload and manage financial documents
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            accept=".pdf,.csv,.txt,.xlsx,.xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </motion.div>

      {/* Upload error */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 bg-danger-light border border-danger/20 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-danger-text">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{uploadError}</span>
            </div>
            <button onClick={() => setUploadError(null)}>
              <X className="w-4 h-4 text-danger-text" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <div className="p-4 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-3 h-3 text-accent" />
            <span className="text-xs text-text-muted font-data uppercase tracking-wider">Total</span>
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
            <CheckCircle2 className="w-3 h-3 text-accent" />
            <span className="text-xs text-text-muted font-data uppercase tracking-wider">Parsed</span>
          </div>
          <span className="text-2xl font-semibold font-data text-accent">{stats.parsed}</span>
        </div>
        <div className="p-4 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-warning" />
            <span className="text-xs text-text-muted font-data uppercase tracking-wider">Processing</span>
          </div>
          <span className="text-2xl font-semibold font-data text-warning">{stats.processing}</span>
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
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
          />
        </div>

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

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
        >
          <option value="all">All Types</option>
          {docTypes.map((type) => (
            <option key={type} value={type}>
              {docTypeLabels[type].label}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="parsed">Parsed</option>
          <option value="processing">Processing</option>
          <option value="error">Error</option>
        </select>

        {(selectedEntity !== 'all' || selectedType !== 'all' || selectedStatus !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedEntity('all');
              setSelectedType('all');
              setSelectedStatus('all');
              setSearchQuery('');
            }}
            className="text-xs text-accent hover:underline"
          >
            Clear filters
          </button>
        )}
      </motion.div>

      {/* Documents list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card animate={false}>
          <CardHeader
            label="Document Library"
            title={`${total} Documents`}
            action={<FileText className="w-5 h-5 text-accent" />}
          />

          {loading ? (
            <SkeletonList rows={8} />
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary font-medium">No documents found</p>
              <p className="text-text-muted text-sm mt-1">
                {searchQuery ? 'Try adjusting your search' : 'Upload a document to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {documents.map((doc, index) => {
                  const isExpanded = expandedId === doc.id;
                  const StatusIcon = statusConfig[doc.status].icon;
                  const DocIcon = docTypeLabels[doc.doc_type]?.icon || FileText;

                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        isExpanded
                          ? 'border-accent/30 bg-accent-light/30'
                          : 'border-border hover:border-border-active hover:bg-surface-hover'
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center flex-shrink-0">
                          <DocIcon className="w-5 h-5 text-text-muted" />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold truncate">{doc.filename}</span>
                            <span
                              className={`flex items-center gap-1 text-[10px] font-data ${statusConfig[doc.status].class}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[doc.status].label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs font-data text-text-muted">
                              {docTypeLabels[doc.doc_type]?.label || doc.doc_type}
                            </span>
                            {doc.entities && (
                              <>
                                <span className="text-text-faint">·</span>
                                <EntityBadge slug={doc.entities.slug} name={doc.entities.name} />
                              </>
                            )}
                            {doc.accounts && (
                              <>
                                <span className="text-text-faint">·</span>
                                <span className="text-xs text-text-muted">{doc.accounts.name}</span>
                              </>
                            )}
                            <span className="text-text-faint">·</span>
                            <span className="text-xs font-data text-text-muted">
                              {formatDate(doc.created_at)}
                            </span>
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
                              >
                                <div className="pt-4 mt-4 border-t border-border space-y-3">
                                  {doc.ai_summary && (
                                    <div>
                                      <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                                        AI Summary
                                      </span>
                                      <p className="text-sm text-text-secondary mt-1">
                                        {doc.ai_summary}
                                      </p>
                                    </div>
                                  )}
                                  {doc.key_figures && Object.keys(doc.key_figures).length > 0 && (
                                    <div>
                                      <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                                        Key Figures
                                      </span>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                        {Object.entries(doc.key_figures).map(([key, value]) => (
                                          <div key={key} className="p-2 bg-surface-alt rounded">
                                            <span className="text-[10px] font-data text-text-muted block">
                                              {key.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-sm font-data font-medium">
                                              {typeof value === 'number'
                                                ? value.toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                  })
                                                : value}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {doc.period_start && doc.period_end && (
                                    <div>
                                      <span className="text-[10px] font-data uppercase tracking-wider text-text-muted">
                                        Period
                                      </span>
                                      <p className="text-sm font-data text-text-secondary mt-1">
                                        {formatDate(doc.period_start)} — {formatDate(doc.period_end)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Expand indicator */}
                        <ChevronRight
                          className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
