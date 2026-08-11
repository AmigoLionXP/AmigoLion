export function Loading() {
  return <div className="py-16 text-center text-sm text-text-muted">Carregando…</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-orange/30 bg-orange/10 px-5 py-4 text-sm text-orange">{message}</div>;
}
