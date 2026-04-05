'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  // Only show on mobile - desktop sidebar has all navigation
  return (
    <header className="md:hidden h-14 border-b border-border bg-surface flex items-center justify-between px-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="p-2 -ml-2 text-text-secondary hover:text-text"
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

      {/* Mobile logo */}
      <span className="font-semibold text-text">CFO</span>

      {/* Spacer */}
      <div className="w-9" />
    </header>
  );
}
