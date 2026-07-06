// icons.jsx

const SvgWrapper = ({ children }) => (
  <svg
    width="80"
    height="60"
    viewBox="0 0 80 60"
    fill="none"
    stroke="#222"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
)

export function FurnitureIcon() {
  return (
    <SvgWrapper>
      <rect x="8" y="28" width="44" height="18" rx="3" />
      <rect x="4" y="22" width="8" height="24" rx="3" />
      <rect x="48" y="22" width="8" height="24" rx="3" />
      <rect x="12" y="34" width="36" height="12" rx="2" />
      <line x1="14" y1="46" x2="14" y2="52" />
      <line x1="46" y1="46" x2="46" y2="52" />
      <line x1="68" y1="52" x2="68" y2="24" />
      <polygon points="62,24 74,24 71,10 65,10" />
      <line x1="60" y1="52" x2="76" y2="52" />
    </SvgWrapper>
  )
}

export function CarTransportIcon() {
  return (
    <SvgWrapper>
      <rect x="2" y="32" width="76" height="16" rx="2" />
      <line x1="2" y1="32" x2="78" y2="32" />
      <rect x="54" y="22" width="24" height="10" rx="2" />
      <rect x="4" y="16" width="28" height="16" rx="3" />
      <rect x="8" y="10" width="20" height="8" rx="2" />
      <circle cx="10" cy="48" r="4" />
      <circle cx="30" cy="48" r="4" />
      <rect x="36" y="16" width="26" height="16" rx="3" />
      <rect x="40" y="10" width="18" height="8" rx="2" />
      <circle cx="52" cy="48" r="4" />
      <circle cx="68" cy="48" r="4" />
    </SvgWrapper>
  )
}

export function MotorcycleTransportIcon() {
  return (
    <SvgWrapper>
      <circle cx="16" cy="42" r="10" />
      <circle cx="64" cy="42" r="10" />
      <path d="M16 42 L30 20 L46 20 L58 34" />
      <path d="M36 20 L42 34 L58 34" />
      <path d="M46 20 L52 14 L62 14" />
      <circle cx="16" cy="42" r="3" />
      <circle cx="64" cy="42" r="3" />
      <path d="M58 34 Q64 34 64 42" />
    </SvgWrapper>
  )
}

export function HomeMovesIcon() {
  return (
    <SvgWrapper>
      <rect x="28" y="28" width="26" height="22" rx="2" />
      <line x1="28" y1="36" x2="54" y2="36" />
      <line x1="41" y1="28" x2="41" y2="36" />

      <circle cx="14" cy="14" r="5" />
      <line x1="14" y1="19" x2="14" y2="38" />
      <line x1="14" y1="26" x2="28" y2="32" />
      <line x1="8" y1="46" x2="14" y2="38" />
      <line x1="20" y1="46" x2="14" y2="38" />

      <circle cx="66" cy="14" r="5" />
      <line x1="66" y1="19" x2="66" y2="38" />
      <line x1="66" y1="26" x2="54" y2="32" />
      <line x1="60" y1="46" x2="66" y2="38" />
      <line x1="72" y1="46" x2="66" y2="38" />
    </SvgWrapper>
  )
}

export function ManWithVanIcon() {
  return (
    <SvgWrapper>
      <rect x="18" y="22" width="46" height="26" rx="3" />
      <rect x="42" y="26" width="18" height="12" rx="1" />
      <circle cx="28" cy="48" r="5" />
      <circle cx="54" cy="48" r="5" />
      <line x1="18" y1="34" x2="64" y2="34" />

      <circle cx="8" cy="16" r="5" />
      <line x1="8" y1="21" x2="8" y2="36" />
      <line x1="2" y1="28" x2="14" y2="28" />
      <line x1="4" y1="46" x2="8" y2="36" />
      <line x1="12" y1="46" x2="8" y2="36" />
      <path d="M14 24 Q18 20 18 26" />
    </SvgWrapper>
  )
}

export function CapeTownIcon() {
  return (
    <SvgWrapper>
      <rect x="22" y="28" width="36" height="26" rx="1" />
      <polygon points="40,6 58,28 22,28" />
      <rect x="34" y="10" width="12" height="18" />
      <polygon points="40,2 28,10 52,10" />
      <rect x="28" y="34" width="8" height="10" rx="1" />
      <rect x="44" y="34" width="8" height="10" rx="1" />
      <rect x="36" y="32" width="8" height="6" rx="1" />
      <line x1="10" y1="54" x2="70" y2="54" />
    </SvgWrapper>
  )
}

export function JohannesburgIcon() {
  return (
    <SvgWrapper>
      <line x1="40" y1="4" x2="40" y2="52" />
      <ellipse cx="40" cy="22" rx="10" ry="6" />
      <line x1="34" y1="52" x2="46" y2="52" />

      <rect x="6" y="30" width="18" height="24" rx="1" />
      <rect x="10" y="22" width="10" height="8" />
      <rect x="56" y="26" width="18" height="28" rx="1" />
      <rect x="60" y="18" width="10" height="8" />

      <line x1="2" y1="54" x2="78" y2="54" />
    </SvgWrapper>
  )
}

export function DurbanIcon() {
  return (
    <SvgWrapper>
      <rect x="14" y="32" width="52" height="22" rx="1" />
      <path d="M14 32 Q40 6 66 32" />
      <line x1="22" y1="32" x2="22" y2="54" />
      <line x1="32" y1="32" x2="32" y2="54" />
      <line x1="48" y1="32" x2="48" y2="54" />
      <line x1="58" y1="32" x2="58" y2="54" />
      <rect x="34" y="40" width="12" height="14" rx="1" />
      <line x1="40" y1="6" x2="40" y2="12" />
      <line x1="8" y1="54" x2="72" y2="54" />
    </SvgWrapper>
  )
}

export function PretoriaIcon() {
  return (
    <SvgWrapper>
      <rect x="8" y="30" width="20" height="24" rx="1" />
      <rect x="52" y="30" width="20" height="24" rx="1" />
      <rect x="24" y="36" width="32" height="18" rx="1" />
      <polygon points="18,30 18,18 28,18 28,30" />
      <polygon points="52,30 52,18 62,18 62,30" />
      <polygon points="18,18 40,8 62,18" />
      <rect x="12" y="36" width="6" height="8" rx="1" />
      <rect x="62" y="36" width="6" height="8" rx="1" />
      <rect x="28" y="42" width="8" height="12" rx="1" />
      <rect x="44" y="42" width="8" height="12" rx="1" />
      <line x1="4" y1="54" x2="76" y2="54" />
    </SvgWrapper>
  )
}

export function PortElizabethIcon() {
  return (
    <SvgWrapper>
      <rect x="20" y="30" width="40" height="24" rx="1" />
      <rect x="32" y="14" width="16" height="16" />
      <polygon points="40,4 28,14 52,14" />
      <circle cx="40" cy="22" r="5" />
      <line x1="40" y1="19" x2="40" y2="22" />
      <line x1="40" y1="22" x2="43" y2="22" />
      <rect x="26" y="36" width="8" height="10" rx="1" />
      <rect x="46" y="36" width="8" height="10" rx="1" />
      <rect x="36" y="36" width="8" height="6" rx="1" />
      <line x1="8" y1="54" x2="72" y2="54" />
    </SvgWrapper>
  )
}

export function BoatTransportIcon() {
  return (
    <SvgWrapper>
      <path d="M8 38 Q20 28 40 28 Q58 28 72 36 L66 44 Q50 48 20 46 Z" />
      <path d="M40 28 L36 18 L52 22 L48 28" />
      <rect x="44" y="22" width="10" height="6" rx="1" />
      <path d="M4 48 Q14 44 24 48 Q34 52 44 48 Q54 44 64 48 Q74 52 78 50" />
      <path d="M4 52 Q16 48 28 52 Q40 56 52 52 Q64 48 76 52" />
    </SvgWrapper>
  )
}

export function PianoMovesIcon() {
  return (
    <SvgWrapper>
      <path d="M16 18 L16 48 Q16 52 20 52 L60 52 Q68 52 72 44 Q76 36 72 24 Q68 14 56 14 L20 14 Q16 14 16 18 Z" />
      <path d="M16 24 L68 24" />

      <line x1="24" y1="24" x2="24" y2="38" />
      <line x1="30" y1="24" x2="30" y2="38" />
      <line x1="36" y1="24" x2="36" y2="38" />
      <line x1="42" y1="24" x2="42" y2="38" />
      <line x1="48" y1="24" x2="48" y2="38" />
      <line x1="54" y1="24" x2="54" y2="38" />

      <rect x="26" y="24" width="5" height="9" rx="1" fill="#222" />
      <rect x="38" y="24" width="5" height="9" rx="1" fill="#222" />
      <rect x="50" y="24" width="5" height="9" rx="1" fill="#222" />

      <line x1="20" y1="52" x2="18" y2="60" />
      <line x1="40" y1="52" x2="40" y2="60" />
    </SvgWrapper>
  )
}
