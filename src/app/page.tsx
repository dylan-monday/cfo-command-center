'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MetricCard, Card, CardHeader } from '@/components/ui';
import { AlertsPanel, EntityGrid, StrategiesPanel, KnowledgePanel, InboxIndicator } from '@/components/panels';
import {
  Building2,
  Wallet,
  AlertCircle,
  PiggyBank,
  FileText,
  Download,
  Cloud,
  Loader2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface DashboardStats {
  entities: number;
  accounts: number;
  openAlerts: number;
  activeStrategies: number;
  totalEstimatedSavings: number;
}

interface Partner {
  id: string;
  name: string;
  company?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    entities: 0,
    accounts: 0,
    openAlerts: 0,
    activeStrategies: 0,
    totalEstimatedSavings: 0,
  });
  const [loading, setLoading] = useState(true);

  // CPA Packet state
  const [packetYear, setPacketYear] = useState(new Date().getFullYear());
  const [packetPartnerId, setPacketPartnerId] = useState<string>('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [generatingPacket, setGeneratingPacket] = useState(false);
  const [packetResult, setPacketResult] = useState<{
    success: boolean;
    driveUrl?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch entities with counts
        const entitiesRes = await fetch('/api/entities');
        const entitiesData = await entitiesRes.json();
        const entities = entitiesData.entities || [];

        // Calculate totals from entities
        let totalAccounts = 0;
        let totalAlerts = 0;
        entities.forEach((e: { _counts: { accounts: number; openAlerts: number } }) => {
          totalAccounts += e._counts?.accounts || 0;
          totalAlerts += e._counts?.openAlerts || 0;
        });

        // Fetch strategies stats
        const strategiesRes = await fetch('/api/strategies');
        const strategiesData = await strategiesRes.json();
        const stratStats = strategiesData.stats || {};

        setStats({
          entities: entities.length,
          accounts: totalAccounts,
          openAlerts: totalAlerts,
          activeStrategies: stratStats.byStatus?.active || 0,
          totalEstimatedSavings: stratStats.totalEstimatedSavings || 0,
        });

        // Fetch CPA partners
        const partnersRes = await fetch('/api/partners?role=cpa');
        const partnersData = await partnersRes.json();
        setPartners(partnersData.partners || []);
        if (partnersData.partners?.length > 0) {
          setPacketPartnerId(partnersData.partners[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Generate year options
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  // Handle CPA packet generation
  const handleGeneratePacket = async (uploadToDrive: boolean) => {
    setGeneratingPacket(true);
    setPacketResult(null);

    try {
      const res = await fetch('/api/cpa-packet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxYear: packetYear,
          partnerId: packetPartnerId || undefined,
          uploadToDrive,
        }),
      });

      if (uploadToDrive) {
        const data = await res.json();
        if (data.success) {
          setPacketResult({ success: true, driveUrl: data.driveUrl });
        } else {
          setPacketResult({ success: false, error: data.error || 'Upload failed' });
        }
      } else {
        // Download the PDF
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `CPA-Packet-${packetYear}-${new Date().toISOString().slice(0, 10)}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setPacketResult({ success: true });
        } else {
          const data = await res.json();
          setPacketResult({ success: false, error: data.error || 'Download failed' });
        }
      }
    } catch (error) {
      console.error('Packet generation error:', error);
      setPacketResult({ success: false, error: 'Failed to generate packet' });
    } finally {
      setGeneratingPacket(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="page-title">Dashboard</h1>
        <p className="text-text-secondary mt-2">
          Your financial command center at a glance
        </p>
      </motion.div>

      {/* Metrics strip - with featured gradient card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Entities"
          value={stats.entities}
          delay={0.05}
          icon={<Building2 className="w-5 h-5" />}
        />
        <MetricCard
          label="Accounts"
          value={stats.accounts}
          delay={0.1}
          icon={<Wallet className="w-5 h-5" />}
        />
        <MetricCard
          label="Open Alerts"
          value={stats.openAlerts}
          variant={stats.openAlerts > 5 ? 'danger' : stats.openAlerts > 0 ? 'warning' : 'default'}
          delay={0.15}
          icon={<AlertCircle className="w-5 h-5" />}
        />
        <MetricCard
          label="Est. Tax Savings"
          value={stats.totalEstimatedSavings}
          format="currency"
          variant="gradient"
          delay={0.2}
          icon={<PiggyBank className="w-5 h-5" />}
        />
      </div>

      {/* Alerts panel - full width for critical items */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <AlertsPanel limit={5} />
      </motion.div>

      {/* Inbox Indicator + CPA Packet Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbox Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
        >
          <InboxIndicator />
        </motion.div>

        {/* CPA Packet Generator */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card animate={false}>
            <CardHeader
              label="Export"
              title="Generate CPA Packet"
              action={<FileText className="w-5 h-5 text-accent" />}
            />
            {/* Form fields */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Tax Year */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Tax Year
                </label>
                <select
                  value={packetYear}
                  onChange={(e) => setPacketYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                  disabled={generatingPacket}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prepared For */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Prepared For
                </label>
                <select
                  value={packetPartnerId}
                  onChange={(e) => setPacketPartnerId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                  disabled={generatingPacket}
                >
                  <option value="">Select CPA...</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.company && ` — ${p.company}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons - full width row */}
            <div className="flex gap-3">
              <button
                onClick={() => handleGeneratePacket(false)}
                disabled={generatingPacket}
                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
              >
                {generatingPacket ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download PDF
              </button>
              <button
                onClick={() => handleGeneratePacket(true)}
                disabled={generatingPacket}
                className="btn-secondary flex-1 py-2.5 flex items-center justify-center gap-2"
              >
                {generatingPacket ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                Save to Drive
              </button>
            </div>

            {/* Result message */}
            {packetResult && (
              <div
                className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  packetResult.success
                    ? 'bg-success-light text-success'
                    : 'bg-danger-light text-danger'
                }`}
              >
                {packetResult.success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">
                      CPA Packet generated!
                      {packetResult.driveUrl && (
                        <a
                          href={packetResult.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 underline inline-flex items-center gap-1"
                        >
                          Open in Drive <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{packetResult.error}</span>
                  </>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Two column layout for entities and strategies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entity map */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <EntityGrid />
        </motion.div>

        {/* Strategies panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <StrategiesPanel limit={6} />
        </motion.div>
      </div>

      {/* Knowledge Base panel - full width */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <KnowledgePanel limit={12} />
      </motion.div>
    </div>
  );
}
