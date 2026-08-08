/** 7market brand mark — gold staircase-into-"7", navy rounded-square background. */
export function LogoMark({ size = 30, radius = 7 }: { size?: number; radius?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="7market">
      <defs>
        <linearGradient id="logoGold" x1="10%" y1="90%" x2="95%" y2="5%">
          <stop offset="0%" stopColor="#8a6a22" />
          <stop offset="35%" stopColor="#C99A2E" />
          <stop offset="70%" stopColor="#E8C468" />
          <stop offset="100%" stopColor="#F8E3A8" />
        </linearGradient>
        <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d2452" />
          <stop offset="100%" stopColor="#081733" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="200" rx={radius * (200 / size)} fill="url(#logoBg)" />
      <g fill="url(#logoGold)">
        <rect x="22" y="146" width="36" height="18" rx="6" />
        <rect x="46" y="118" width="40" height="18" rx="6" />
        <rect x="70" y="90" width="40" height="18" rx="6" />
        <path d="M156 28 L98 28 L98 50 L134 50 L58 172 L84 172 L166 40 Z" />
      </g>
    </svg>
  );
}
