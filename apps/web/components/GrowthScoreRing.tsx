export function GrowthScoreRing({ score, size = 104 }: { score: number; size?: number }) {
  const dash = `${Math.round((score / 1000) * 339)} 339`;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="url(#growth-score-gradient)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={dash}
        />
        <defs>
          <linearGradient id="growth-score-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#C99A2E" />
            <stop offset="1" stopColor="#F4D48A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-[30px] font-bold leading-none text-white">{score}</div>
        <div className="font-mono text-[9px] tracking-[.1em] text-text-secondary">/ 1000</div>
      </div>
    </div>
  );
}
