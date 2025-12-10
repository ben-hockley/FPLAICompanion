// Custom UK country flag components
// These represent the specific flags for England, Scotland, Wales, and Northern Ireland

export const EnglandFlag = ({ className = "", title = "England" }) => (
  <svg viewBox="0 0 60 30" className={className} title={title}>
    <rect width="60" height="30" fill="#fff" />
    <path d="M0,15 L60,15 M30,0 L30,30" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

export const ScotlandFlag = ({ className = "", title = "Scotland" }) => (
  <svg viewBox="0 0 60 30" className={className} title={title}>
    <rect width="60" height="30" fill="#0065BF" />
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
  </svg>
);

export const WalesFlag = ({ className = "", title = "Wales" }) => (
  <svg viewBox="0 0 60 30" className={className} title={title}>
    <rect width="60" height="30" fill="#00B140" />
    <rect width="60" height="15" fill="#fff" />
    <g transform="translate(30,15)">
      <path d="M-8,-3 L-8,3 L-6,3 L-6,5 L-4,5 L-4,3 L-2,3 L-2,5 L0,5 L0,3 L2,3 L2,5 L4,5 L4,3 L6,3 L6,-3 L4,-3 L4,-5 L2,-5 L2,-3 L0,-3 L0,-5 L-2,-5 L-2,-3 L-4,-3 L-4,-5 L-6,-5 L-6,-3 z" fill="#D4271E" />
      <circle cx="-3" cy="-1" r="1.5" fill="#D4271E" />
      <circle cx="3" cy="-1" r="1.5" fill="#D4271E" />
    </g>
  </svg>
);

export const NorthernIrelandFlag = ({ className = "", title = "Northern Ireland" }) => (
  <svg viewBox="0 0 60 30" className={className} role="img" aria-label={title}>
    <title>{title}</title>
    <rect width="60" height="30" fill="#ffffff" />
    {/* St George's Cross */}
    <rect x="27" width="6" height="30" fill="#C8102E" />
    <rect y="12" width="60" height="6" fill="#C8102E" />

    {/* Central device: six-pointed star, red hand, small crown (stylised) */}
    <g transform="translate(30,15)">
      {/* Six-pointed star by overlaying two triangles (gold) */}
      <polygon points="0,-5 3,2.5 -3,2.5" fill="#FFFFFF" />
      <polygon points="0,5 -3,-2.5 3,-2.5" fill="#FFFFFF" />

      {/* Red hand (simplified stylised version) */}
      <path
        d="M-1,0 C-1,-1.2 0,-1.8 0,-1.8 C0,-1.8 1,-1.2 1,0 C1,1 0.5,1.6 0.0,1.6 C-0.5,1.6 -1,1 -1,0 Z"
        fill="#C8102E"
        transform="translate(0,0.2) scale(1.2)"
      />

      {/* Small crown above the star (simplified) */}
      <g transform="translate(0,-8) scale(0.9)">
        <path d="M-4,0 L-2.5,-3 L-1,0 L0,-2 L1,0 L2.5,-3 L4,0 L4,1 L-4,1 Z" fill="#D99B00" />
        <circle cx="-2.2" cy="-1.2" r="0.3" fill="#C8102E" />
        <circle cx="2.2" cy="-1.2" r="0.3" fill="#C8102E" />
        <circle cx="0" cy="-1.8" r="0.35" fill="#C8102E" />
      </g>
    </g>
  </svg>
);
