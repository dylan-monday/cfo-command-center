'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardHeader } from '@/components/ui';
import {
  FolderInput,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';

interface InboxStatus {
  configured: boolean;
  folderExists: boolean;
  inboxCount: number;
  lastSweep: string | null;
  lastSweepResult: string | null;
  totalProcessed: number;
  recentDocuments: Array<{
    filename: string;
    created_at: string;
    ai_summary: string | null;
  }>;
}

export function InboxIndicator() {
  const [status, setStatus] = useState<InboxStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/cron/drive-sweep/status');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch inbox status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh status every 2 minutes
    const interval = setInterval(fetchStatus, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleSweepNow = async () => {
    setSweeping(true);
    setSweepResult(null);

    try {
      const res = await fetch('/api/cron/drive-sweep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (data.success) {
        setSweepResult({
          success: true,
          message: data.filesProcessed > 0
            ? `Processed ${data.filesProcessed} files (${data.succeeded} succeeded)`
            : 'No files to process',
        });
        // Refresh status after sweep
        await fetchStatus();
      } else {
        setSweepResult({
          success: false,
          message: data.error || 'Sweep failed',
        });
      }
    } catch (error) {
      setSweepResult({
        success: false,
        message: error instanceof Error ? error.message : 'Sweep failed',
      });
    } finally {
      setSweeping(false);
    }
  };

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card animate={false}>
        <CardHeader
          label="Auto-Import"
          title="Google Drive Inbox"
          action={<FolderInput className="w-5 h-5 text-text-muted" />}
        />
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
        </div>
      </Card>
    );
  }

  if (!status?.configured) {
    return (
      <Card>
        <CardHeader
          label="Auto-Import"
          title="Google Drive Inbox"
          action={<FolderInput className="w-5 h-5 text-text-muted" />}
        />
        <div className="flex items-center gap-3 p-4 bg-surface-alt rounded-lg">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
          <div className="text-sm text-text-secondary">
            Google Drive not configured. Set GOOGLE_DRIVE_FOLDER_ID in environment variables.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        label="Auto-Import"
        title="Google Drive Inbox"
        action={
          <button
            onClick={handleSweepNow}
            disabled={sweeping}
            className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            {sweeping ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {sweeping ? 'Sweeping...' : 'Sweep Now'}
          </button>
        }
      />

      <div className="space-y-4">
        {/* Inbox Count Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                status.inboxCount > 0
                  ? 'bg-warning-light'
                  : 'bg-success-light'
              }`}
            >
              <FolderInput
                className={`w-5 h-5 ${
                  status.inboxCount > 0 ? 'text-warning' : 'text-success'
                }`}
              />
            </div>
            <div>
              <div className="font-mono text-lg font-semibold">
                {status.inboxCount}
              </div>
              <div className="text-xs text-text-muted">
                {status.inboxCount === 1 ? 'file' : 'files'} in inbox
              </div>
            </div>
          </div>

          {/* Last Sweep Time */}
          {status.lastSweep && (
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Clock className="w-3.5 h-3.5" />
                Last sweep
              </div>
              <div className="text-sm font-medium">
                {formatTimeAgo(status.lastSweep)}
              </div>
            </div>
          )}
        </div>

        {/* Sweep Result Message */}
        {sweepResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg flex items-center gap-2 ${
              sweepResult.success
                ? 'bg-success/10 text-success'
                : 'bg-danger/10 text-danger'
            }`}
          >
            {sweepResult.success ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm">{sweepResult.message}</span>
          </motion.div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <div className="text-xs text-text-muted">
            <span className="font-mono font-medium text-text">
              {status.totalProcessed}
            </span>{' '}
            total processed
          </div>
          {!status.folderExists && (
            <div className="text-xs text-warning">
              Inbox folder will be created on first sweep
            </div>
          )}
        </div>

        {/* Recent Documents */}
        {status.recentDocuments.length > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="text-xs font-medium text-text-muted mb-2">
              Recently Processed
            </div>
            <div className="space-y-2">
              {status.recentDocuments.slice(0, 3).map((doc, idx) => (
                <div
                  key={idx}
                  className="text-xs p-2 bg-surface-alt rounded-lg"
                >
                  <div className="font-medium truncate">{doc.filename}</div>
                  <div className="text-text-muted mt-0.5">
                    {formatTimeAgo(doc.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
