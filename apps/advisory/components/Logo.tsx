export function Logo({ size = 38 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/7m-gold-mono.png" alt="7M Advisory" style={{ height: size, width: size }} className="rounded-lg" />
      <span className="font-display text-xl font-bold text-white">Advisory</span>
    </div>
  );
}
