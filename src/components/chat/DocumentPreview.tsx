'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Check,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Building,
} from 'lucide-react';

interface KeyFigure {
  key: string;
  value: string | number;
  edited?: boolean;
}

interface DocumentPreviewProps {
  filename: string;
  summary: string;
  docType: string;
  keyFigures: Record<string, string | number>;
  suggestedEntity?: string | null;
  questions?: string[];
  onConfirm: (edits: Record<string, string | number>) => void;
  onReject: () => void;
  isConfirming?: boolean;
}

export function DocumentPreview({
  filename,
  summary,
  docType,
  keyFigures,
  suggestedEntity,
  questions,
  onConfirm,
  onReject,
  isConfirming = false,
}: DocumentPreviewProps) {
  const [expanded, setExpanded] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedFigures, setEditedFigures] = useState<Record<string, string | number>>({});

  const figures: KeyFigure[] = Object.entries(keyFigures || {}).map(([key, value]) => ({
    key,
    value: editedFigures[key] !== undefined ? editedFigures[key] : value,
    edited: editedFigures[key] !== undefined,
  }));

  const handleEditFigure = (key: string, newValue: string) => {
    // Try to parse as number if it looks like one
    const numValue = parseFloat(newValue.replace(/[,$]/g, ''));
    setEditedFigures((prev) => ({
      ...prev,
      [key]: isNaN(numValue) ? newValue : numValue,
    }));
  };

  const handleConfirm = () => {
    onConfirm(editedFigures);
  };

  const formatValue = (value: string | number): string => {
    if (typeof value === 'number') {
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    }
    return String(value);
  };

  const formatKey = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-accent/20 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div
        className="p-4 bg-accent-light/30 border-b border-accent/10 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text truncate">{filename}</span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-accent/10 text-accent rounded-full">
                {docType.replace(/-/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{summary}</p>
          </div>
          <button className="p-1 text-text-muted">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Entity suggestion */}
          {suggestedEntity && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="w-4 h-4 text-text-muted" />
              <span className="text-text-muted">Suggested entity:</span>
              <span className="font-medium text-accent">{suggestedEntity}</span>
            </div>
          )}

          {/* Key figures */}
          {figures.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Extracted Figures
                </span>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <Edit3 className="w-3 h-3" />
                  {editMode ? 'Done editing' : 'Edit values'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {figures.map((fig) => (
                  <div
                    key={fig.key}
                    className={`p-3 rounded-lg ${
                      fig.edited ? 'bg-warning-light border border-warning/20' : 'bg-surface-alt'
                    }`}
                  >
                    <span className="text-[10px] text-text-muted block mb-1">
                      {formatKey(fig.key)}
                      {fig.edited && <span className="text-warning ml-1">(edited)</span>}
                    </span>
                    {editMode ? (
                      <input
                        type="text"
                        value={String(fig.value)}
                        onChange={(e) => handleEditFigure(fig.key, e.target.value)}
                        className="w-full text-sm font-mono font-medium bg-white border border-border rounded px-2 py-1 focus:outline-none focus:border-accent"
                      />
                    ) : (
                      <span className="text-sm font-mono font-semibold">
                        {formatValue(fig.value)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions from Claude */}
          {questions && questions.length > 0 && (
            <div className="p-3 bg-warning-light/50 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-warning-text block mb-1">
                    Questions about this document:
                  </span>
                  <ul className="text-xs text-text-secondary space-y-1">
                    {questions.map((q, i) => (
                      <li key={i}>• {q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <span className="text-xs text-text-muted flex-1">
              Review the extracted data above. Edit any incorrect values before confirming.
            </span>
            <button
              onClick={onReject}
              disabled={isConfirming}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary hover:text-danger bg-surface-alt hover:bg-danger-light rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Discard
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-lg transition-colors disabled:opacity-50"
            >
              {isConfirming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isConfirming ? 'Saving...' : 'Confirm & Save'}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
