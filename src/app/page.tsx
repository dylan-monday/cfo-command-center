export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-8">
      <main className="card max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-accent)' }}>
          CFO Command Center
        </h1>
        <p className="text-text-secondary mb-6">
          Your conversational financial operating system
        </p>
        <div className="space-y-2 text-sm text-text-muted">
          <p className="font-data">Phase 1 Complete</p>
          <p>Next.js + TypeScript + Tailwind</p>
          <p>Design system configured</p>
          <p>Dependencies installed</p>
        </div>
      </main>
    </div>
  );
}
