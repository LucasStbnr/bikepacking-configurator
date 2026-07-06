/* Shared pieces for OG image generation (rendered by Satori via next/og). */

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_COLORS = {
  background: "#f6f5f1",
  surface: "#ffffff",
  ink: "#1a1a17",
  muted: "#807d74",
  faint: "#b3b0a6",
  line: "#e5e3db",
  accent: "#e8500b",
  blueprint: "#3d6ba3",
};

/** Simplified side-view bike with realistic proportions (Satori-compatible). */
export function OgBike({ color, width = 420 }: { color: string; width?: number }) {
  const h = Math.round(width * 0.62);
  return (
    <svg width={width} height={h} viewBox="0 0 420 260">
      {/* wheels — true-to-life radius vs wheelbase */}
      <circle cx="100" cy="168" r="80" fill="none" stroke={OG_COLORS.ink} strokeWidth="11" />
      <circle cx="320" cy="168" r="80" fill="none" stroke={OG_COLORS.ink} strokeWidth="11" />
      <circle cx="100" cy="168" r="62" fill="none" stroke={OG_COLORS.faint} strokeWidth="2" />
      <circle cx="320" cy="168" r="62" fill="none" stroke={OG_COLORS.faint} strokeWidth="2" />
      {/* frame */}
      <path
        d="M180 190 L100 168 M100 168 L163 96 M180 190 L163 96 L272 84 M180 190 L286 118 M272 84 L286 118 M286 118 L320 168"
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* seatpost + saddle */}
      <path d="M163 96 L155 74 M132 70 L176 70" stroke={OG_COLORS.ink} strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* stem + drop bar */}
      <path
        d="M272 84 L296 76 L312 76 C 324 78 326 90 318 98"
        fill="none"
        stroke={OG_COLORS.ink}
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* crank */}
      <circle cx="180" cy="190" r="15" fill="none" stroke={OG_COLORS.muted} strokeWidth="3" />
    </svg>
  );
}
