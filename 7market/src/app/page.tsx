export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 p-16 text-center dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">7MARKET — Backend</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Projeto de backend (Supabase + rotas de API). O front-end da landing e do app é implementado separadamente —
        ver README.md.
      </p>
    </main>
  );
}
