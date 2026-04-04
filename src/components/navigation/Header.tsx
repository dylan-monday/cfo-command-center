'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text"
        aria-label="Toggle menu"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* Desktop: Just a placeholder, logo is in sidebar */}
      <div className="hidden md:block" />

      {/* Center: Navigation tabs (optional, can be empty) */}
      <div className="flex-1" />

      {/* Right: Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-text-muted font-data">Connected</span>
        </div>
      </div>
    </header>
  );
}
