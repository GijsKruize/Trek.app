import { TrekMark } from "./TrekMark";

type TrekWordmarkVariant = "auto" | "primary" | "reversed" | "mono";

interface TrekWordmarkProps {
  variant?: TrekWordmarkVariant;
  /** Rendered width in px. Brandbook minimum is 64px — don't go below it. */
  width?: number;
  className?: string;
}

/**
 * The drawn "Trek?" wordmark. One rounded stroke builds every letter —
 * never typeset in a font. The "?" is delegated to TrekMark so both
 * components share one source of truth for the question mark.
 *
 * Default is "auto": letters use `--foreground` (Aubergine on light,
 * Bloem on dark — the brandbook's primary/reversed pairing), so a caller
 * on a page that follows the site theme gets the right variant for
 * whichever background the current theme actually renders, instead of
 * needing to track that itself. Pass "primary"/"reversed"/"mono"
 * explicitly only on a fixed-color surface that doesn't track the page
 * theme (e.g. the brandbook's Paprika-swatch "mono" icon use).
 *
 * Deviation from the brandbook: these are geometric, monoline
 * interpretations of T-r-e-k, not a hand-tuned bespoke letterform set —
 * see HANDOVER.md. They satisfy "drawn, not typeset" but should be
 * refined by a designer before this ships for real.
 */
export function TrekWordmark({ variant = "auto", width = 160, className }: TrekWordmarkProps) {
  const letterColor =
    variant === "mono" || variant === "reversed"
      ? "var(--bloem)"
      : variant === "primary"
        ? "var(--aubergine-900)"
        : "var(--foreground)";

  return (
    <svg
      viewBox="0 0 560 160"
      width={width}
      height={(width / 560) * 160}
      fill="none"
      className={className}
      role="img"
      aria-label="Trek?"
    >
      <g stroke={letterColor} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round">
        {/* T */}
        <path d="M 18 22 L 108 22" />
        <path d="M 63 22 L 63 132" />
        {/* r */}
        <path d="M 148 60 L 148 132" />
        <path d="M 148 72 Q 164 50 198 56" />
        {/* e */}
        <path d="M 268 92 L 213 92 A 37 37 0 1 1 250 128" />
        {/* k */}
        <path d="M 303 22 L 303 132" />
        <path d="M 303 86 L 349 44" />
        <path d="M 316 99 L 356 132" />
      </g>
      <g transform="translate(400, 0)">
        <TrekMarkGlyph variant={variant} />
      </g>
    </svg>
  );
}

function TrekMarkGlyph({ variant }: { variant: TrekWordmarkVariant }) {
  let hookColor: string;
  let dotColor: string;

  if (variant === "mono") {
    hookColor = "var(--bloem)";
    dotColor = "var(--bloem)";
  } else if (variant === "reversed") {
    hookColor = "var(--paprika-500)";
    dotColor = "var(--saffraan)";
  } else if (variant === "primary") {
    hookColor = "var(--paprika-500)";
    dotColor = "var(--paprika-500)";
  } else {
    hookColor = "var(--wordmark-hook)";
    dotColor = "var(--wordmark-dot)";
  }

  return (
    <g>
      <path
        d="M 20 48 Q 20 14 54 14 Q 86 14 86 42 Q 86 64 62 76 Q 44 85 44 104"
        stroke={hookColor}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="44" cy="140" r="11" fill={dotColor} />
    </g>
  );
}

export { TrekMark };
