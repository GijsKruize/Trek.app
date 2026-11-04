type TrekMarkVariant = "primary" | "reversed" | "mono";

interface TrekMarkProps {
  variant?: TrekMarkVariant;
  size?: number;
  className?: string;
}

/**
 * The standalone "?" glyph — never set in a font. The hook asks, the dot
 * answers, so they're drawn as two separate shapes with independent
 * colors per the brandbook's variant rules. Below 40px the hook switches
 * to Aubergine for contrast in the primary variant; the dot always stays
 * Paprika there.
 */
export function TrekMark({ variant = "primary", size = 24, className }: TrekMarkProps) {
  let hookColor: string;
  let dotColor: string;

  if (variant === "mono") {
    hookColor = "var(--bloem)";
    dotColor = "var(--bloem)";
  } else if (variant === "reversed") {
    hookColor = "var(--paprika-500)";
    dotColor = "var(--saffraan)";
  } else {
    hookColor = size < 40 ? "var(--aubergine-900)" : "var(--paprika-500)";
    dotColor = "var(--paprika-500)";
  }

  return (
    <svg
      viewBox="0 0 100 160"
      width={size}
      height={size * 1.6}
      fill="none"
      className={className}
      role="img"
      aria-label="Trek?"
    >
      <path
        d="M 20 48 Q 20 14 54 14 Q 86 14 86 42 Q 86 64 62 76 Q 44 85 44 104"
        stroke={hookColor}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="140" r="11" fill={dotColor} />
    </svg>
  );
}
