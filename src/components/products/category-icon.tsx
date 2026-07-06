import type { ProductCategory } from "@/db/schema";

/** Line-art placeholder icons for products without a photo, one per category. */
export function CategoryIcon({
  category,
  className,
}: {
  category: ProductCategory;
  className?: string;
}) {
  const stroke = "var(--faint)";
  const common = {
    fill: "none",
    stroke,
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (category) {
    case "bike":
      return (
        <svg viewBox="0 0 120 80" className={className} aria-hidden>
          <circle cx="28" cy="56" r="18" {...common} />
          <circle cx="92" cy="56" r="18" {...common} />
          <path d="M28 56 L46 26 L78 24 L92 56 M28 56 L54 58 L46 26 M54 58 L78 24 M78 24 L74 16 M46 26 L44 18 M38 17 L50 17" {...common} />
          <path d="M74 16 L82 15 C 87 16 88 20 85 24" {...common} strokeWidth={2.5} />
        </svg>
      );
    case "wheels":
      return (
        <svg viewBox="0 0 120 80" className={className} aria-hidden>
          {/* wheel with spokes + loose tyre */}
          <circle cx="48" cy="42" r="27" {...common} />
          <circle cx="48" cy="42" r="20" {...common} strokeWidth={2} opacity={0.7} />
          <circle cx="48" cy="42" r="3" {...common} strokeWidth={2.5} />
          <path d="M48 22 L48 62 M28 42 L68 42 M34 28 L62 56 M62 28 L34 56" {...common} strokeWidth={1.5} opacity={0.7} />
          <path d="M88 26 C 98 32 100 48 92 58" {...common} strokeWidth={4} />
          <path d="M83 32 C 90 37 91 47 86 53" {...common} strokeWidth={2.5} opacity={0.7} />
        </svg>
      );
    case "bag":
      return (
        <svg viewBox="0 0 120 80" className={className} aria-hidden>
          {/* saddle pack silhouette */}
          <path
            d="M96 30 C 96 24 90 22 84 23 L 34 30 C 22 32 16 40 17 48 C 18 56 26 60 36 59 L 84 55 C 92 54 96 50 96 44 Z"
            {...common}
          />
          <line x1="42" y1="29" x2="44" y2="58" {...common} strokeWidth={2} opacity={0.7} />
          <line x1="62" y1="27" x2="64" y2="57" {...common} strokeWidth={2} opacity={0.7} />
          <path d="M96 34 L 104 32 M96 44 L 104 44" {...common} strokeWidth={2.5} />
        </svg>
      );
    case "accessory":
      return (
        <svg viewBox="0 0 120 80" className={className} aria-hidden>
          {/* bottle in a cage */}
          <path d="M52 14 L68 14 L66 24 C 70 28 71 32 71 38 L71 62 C 71 66 68 68 64 68 L56 68 C 52 68 49 66 49 62 L49 38 C 49 32 50 28 54 24 Z" {...common} />
          <path d="M44 34 L49 34 M44 34 C 40 34 38 38 40 42 L 46 54" {...common} strokeWidth={2.5} />
          <line x1="49" y1="46" x2="71" y2="46" {...common} strokeWidth={2} opacity={0.7} />
        </svg>
      );
    case "gear":
      return (
        <svg viewBox="0 0 120 80" className={className} aria-hidden>
          {/* tent */}
          <path d="M60 18 L98 64 L22 64 Z" {...common} />
          <path d="M60 18 L60 64 M60 40 L74 64 M60 40 L46 64" {...common} strokeWidth={2.5} opacity={0.8} />
          <line x1="14" y1="64" x2="106" y2="64" {...common} strokeWidth={2} />
        </svg>
      );
  }
}
