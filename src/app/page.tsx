'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MetricCard } from '@/components/ui';
import { AlertsPanel, EntityGrid, StrategiesPanel, KnowledgePanel } from '@/components/panels';
import { Building2, Wallet, AlertCircle, PiggyBank } from 'lucide-react';

interface DashboardStats {
  entities: number;
  accounts: number;
  openAlerts: number;
  activeStrategies: number;
  totalEstimatedSavings: number;
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
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

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
