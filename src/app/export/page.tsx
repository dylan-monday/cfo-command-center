'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardHeader, SkeletonList } from '@/components/ui';
import {
  FileText,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  FolderOpen,
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  role: string;
  company?: string;
  status: string;
}

interface ExportFile {
  name: string;
  url: string;
}

interface ExportResult {
  success: boolean;
  files?: ExportFile[];
  errors?: string[];
  taxYear?: number;
  partner?: { name: string; company?: string };
}

export default function ExportPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  // Form state
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [taxYear, setTaxYear] = useState<number>(new Date().getFullYear());
  const [exportType, setExportType] = useState<string>('full');

  // Fetch partners (only CPAs and active)
  useEffect(() => {
    async function fetchPartners() {
      try {
        const res = await fetch('/api/partners?role=cpa');
        const data = await res.json();
        setPartners(data.partners || []);

        // Auto-select first CPA if available
        if (data.partners?.length > 0) {
          setSelectedPartner(data.partners[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch partners:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);

    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxYear,
          type: exportType,
          partnerId: selectedPartner || undefined,
        }),
      });

      const data = await res.json();
      setExportResult(data);
    } catch (error) {
      console.error('Export error:', error);
      setExportResult({
        success: false,
        errors: ['Failed to generate export'],
      });
    } finally {
      setExporting(false);
    }
  };

  const selectedPartnerData = partners.find((p) => p.id === selectedPartner);

  // Generate year options (last 5 years + current)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const exportTypes = [
    { value: 'full', label: 'Full CPA Package', description: 'Knowledge base, strategies, and action items' },
    { value: 'knowledge', label: 'Knowledge Base Only', description: 'All facts and data points' },
    { value: 'strategies', label: 'Tax Strategies Only', description: 'Strategy status and CPA flags' },
    { value: 'actions', label: 'Action Items Only', description: 'Open items and alerts' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">CPA Export</h1>
        <p className="text-text-secondary mt-2">
          Generate CPA-ready documents and export to Google Drive
        </p>
      </motion.div>

      {/* Export form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card animate={false}>
          <CardHeader
            label="Export Configuration"
            title="Generate CPA Packet"
            action={<FileText className="w-5 h-5 text-accent" />}
          />

          {loading ? (
            <SkeletonList rows={4} />
          ) : (
            <div className="space-y-6">
              {/* Prepared for (Partner selection) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Users className="w-4 h-4 inline mr-2 text-text-muted" />
                  Prepared for
                </label>
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">Select a partner...</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                      {partner.company && ` — ${partner.company}`}
                    </option>
                  ))}
                </select>
                {selectedPartnerData && (
                  <p className="text-xs text-text-muted mt-1">
                    Cover page will read: "Prepared for {selectedPartnerData.name}
                    {selectedPartnerData.company && `, ${selectedPartnerData.company}`}"
                  </p>
                )}
              </div>

              {/* Tax Year */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-2 text-text-muted" />
                  Tax Year
                </label>
                <select
                  value={taxYear}
                  onChange={(e) => setTaxYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FolderOpen className="w-4 h-4 inline mr-2 text-text-muted" />
                  Export Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {exportTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        exportType === type.value
                          ? 'border-accent bg-accent-light/10'
                          : 'border-border hover:border-border-active'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportType"
                        value={type.value}
                        checked={exportType === type.value}
                        onChange={(e) => setExportType(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <span className="text-sm font-medium">{type.label}</span>
                        <p className="text-xs text-text-muted mt-0.5">{type.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-surface-alt border border-border rounded-lg">
                <h3 className="text-sm font-semibold mb-3">Cover Page Preview</h3>
                <div className="font-data text-sm space-y-1">
                  <p className="text-lg font-semibold">DiBona Financial</p>
                  <p className="text-text-secondary">
                    Tax Year {taxYear} — {exportTypes.find(t => t.value === exportType)?.label || 'CPA Packet'}
                  </p>
                  {selectedPartnerData && (
                    <p className="text-text-muted">
                      Prepared for {selectedPartnerData.name}
                      {selectedPartnerData.company && `, ${selectedPartnerData.company}`}
                    </p>
                  )}
                  <p className="text-text-faint text-xs">
                    Generated {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Export button */}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating export...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generate & Export to Google Drive
                  </>
                )}
              </button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Export result */}
      {exportResult && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card animate={false}>
            <CardHeader
              label="Export Result"
              title={exportResult.success ? 'Export Complete' : 'Export Failed'}
              action={
                exportResult.success ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-danger" />
                )
              }
            />

            {exportResult.success && exportResult.files && exportResult.files.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  {exportResult.files.length} file(s) exported to Google Drive:
                </p>
                {exportResult.files.map((file, index) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-accent hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">{file.name}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-text-muted" />
                  </a>
                ))}
              </div>
            ) : exportResult.errors && exportResult.errors.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-danger">Export encountered errors:</p>
                {exportResult.errors.map((error, index) => (
                  <p key={index} className="text-sm text-text-secondary">
                    • {error}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No files were generated.</p>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
}
