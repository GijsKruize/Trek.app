type TrekMarkVariant = "auto" | "primary" | "reversed" | "mono";

interface TrekMarkProps {
  variant?: TrekMarkVariant;
  size?: number;
  className?: string;
}

/**
 * The standalone "?" glyph — never set in a font. The hook asks, the dot
 * answers, so they're drawn as two separate shapes with independent
 * colors per the brandbook's variant rules. Below 40px the hook switches
 * to Aubergine for contrast in the primary variant (Paprika-500 strokes
 * on Bloem are only 3.2:1); the dot always stays Paprika there.
 *
 * Default is "auto": Paprika hook + Paprika dot on a light/Bloem
 * surface, Paprika hook + Saffraan dot on a dark/Aubergine one — i.e.
 * primary vs. reversed picked automatically via the same CSS variables
 * that already flip with the `.dark` class (globals.css), so a caller
 * on a page that follows the site theme never has to remember which
 * variant matches the current background (forgetting this is how the
 * wordmark used to render invisible — Aubergine-on-Aubergine — in dark
 * mode). Pass "primary"/"reversed" explicitly only when placing the mark
 * on a fixed-color surface that doesn't track the page theme.
 */
export function TrekMark({ variant = "auto", size = 24, className }: TrekMarkProps) {
  let hookColor: string;
  let dotColor: string;

  if (variant === "mono") {
    hookColor = "var(--bloem)";
    dotColor = "var(--bloem)";
  } else if (variant === "reversed") {
    hookColor = "var(--paprika-500)";
    dotColor = "var(--saffraan)";
  } else if (variant === "primary") {
    hookColor = size < 40 ? "var(--aubergine-900)" : "var(--paprika-500)";
    dotColor = "var(--paprika-500)";
  } else {
    hookColor = size < 40 ? "var(--wordmark-hook-small)" : "var(--wordmark-hook)";
    dotColor = "var(--wordmark-dot)";
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
