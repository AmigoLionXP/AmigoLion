export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="font-mono text-xs uppercase tracking-[.18em] text-gold">7M Advisory</div>
      <h1 className="font-display text-3xl font-bold">Backend ativo</h1>
      <p className="max-w-md text-sm text-text-tertiary">
        As telas (landing, wizard, dashboards) ainda serão portadas do design handoff. Este build
        traz o backend completo: auth, banco, API e integrações.
      </p>
    </main>
  );
}
