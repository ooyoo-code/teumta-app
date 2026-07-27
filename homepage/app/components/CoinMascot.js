export default function CoinMascot({ color = "#FFD54F", size = 96, rainbow = false, className = "" }) {
  const gradientId = "coin-rainbow-gradient";
  const fill = rainbow ? `url(#${gradientId})` : color;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {rainbow && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5c5c" />
            <stop offset="25%" stopColor="#ffb84d" />
            <stop offset="50%" stopColor="#ffe75c" />
            <stop offset="75%" stopColor="#5cd6a1" />
            <stop offset="100%" stopColor="#6fa8ff" />
          </linearGradient>
        </defs>
      )}
      <circle cx="80" cy="30" r="15" fill={fill} stroke="#000" strokeWidth="4" />
      <circle cx="120" cy="30" r="15" fill={fill} stroke="#000" strokeWidth="4" />
      <path
        d="M68 42 Q100 58 132 42 L132 54 Q100 70 68 54 Z"
        fill={fill}
        stroke="#000"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M28 92 Q28 52 100 52 Q172 52 172 92 Q172 175 100 175 Q28 175 28 92 Z"
        fill={fill}
        stroke="#000"
        strokeWidth="4"
      />
      <g stroke="#000" strokeWidth="4" strokeLinecap="round">
        <line x1="58" y1="102" x2="80" y2="99" />
        <line x1="58" y1="111" x2="80" y2="108" />
        <line x1="58" y1="120" x2="80" y2="117" />
        <line x1="120" y1="99" x2="142" y2="102" />
        <line x1="120" y1="108" x2="142" y2="111" />
        <line x1="120" y1="117" x2="142" y2="120" />
      </g>
      <path
        d="M90 128 Q100 139 110 128"
        fill="none"
        stroke="#000"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
