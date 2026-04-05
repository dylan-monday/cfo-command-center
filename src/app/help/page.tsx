'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui';
import {
  MessageCircle,
  Building2,
  Wallet,
  Target,
  FileText,
  Brain,
  ArrowRight,
} from 'lucide-react';

export default function HelpPage() {
  const capabilities = [
    {
      icon: Building2,
      title: 'Entity Management',
      description:
        'Full visibility into all 7 entities: M+P, Game of Thrones LLC, Saratoga, Nice, Chippewa, Hidden Valley Ranch, and Personal.',
    },
    {
      icon: Wallet,
      title: 'Account Tracking',
      description:
        'Tracks all accounts across entities — checking, savings, credit, brokerage, retirement, mortgages, and 529 plans.',
    },
    {
      icon: Target,
      title: 'Tax Strategies',
      description:
        'Monitors 17+ tax strategies including Solo 401(k), QBI deduction, self-employed health insurance, and property depreciation.',
    },
    {
      icon: FileText,
      title: 'Document Intelligence',
      description:
        'Parses and understands statements, tax forms, and financial documents. Extracts key figures automatically.',
    },
    {
      icon: Brain,
      title: 'Persistent Knowledge',
      description:
        'Remembers every fact you tell it. Tax rates, deadlines, tenant details, CPA preferences — it\'s all stored.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <h1 className="page-title">Help</h1>
        <p className="text-text-secondary mt-2">
          Get the most out of your CFO Command Center
        </p>
      </motion.div>

      {/* Main CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card animate={false}>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-text mb-3">
              Ask your CFO anything
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-6">
              The chat has full context on all your entities, accounts, tax strategies,
              and documents. Just ask in plain English — it knows your situation.
            </p>
            <Link
              href="/chat"
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
            >
              Start a conversation
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Example questions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <Card animate={false}>
          <CardHeader
            label="Examples"
            title="Things you can ask"
            action={<MessageCircle className="w-5 h-5 text-accent" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'What tax deadlines are coming up?',
              "What's the status of my 401(k) contributions?",
              'Summarize the GOT property finances',
              'What actions need my attention?',
              'How much did I pay in property insurance this year?',
              'What are the rent rolls for my properties?',
              "What's the mortgage balance on Saratoga?",
              'Which strategies need CPA review?',
            ].map((question) => (
              <Link
                key={question}
                href="/chat"
                className="p-3 text-sm text-left border border-border rounded-lg hover:border-accent hover:bg-surface-hover transition-colors"
              >
                "{question}"
              </Link>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Capabilities */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card animate={false}>
          <CardHeader
            label="Capabilities"
            title="What the system knows"
            action={<Brain className="w-5 h-5 text-accent" />}
          />
          <div className="space-y-4">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="text-center text-sm text-text-muted"
      >
        <p>
          Need to add data or fix something? Visit{' '}
          <Link href="/settings" className="text-accent hover:underline">
            Settings
          </Link>{' '}
          to manage your knowledge base.
        </p>
      </motion.div>
    </div>
  );
}
