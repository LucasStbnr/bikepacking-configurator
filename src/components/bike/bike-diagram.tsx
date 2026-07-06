"use client";

import type { BikeStyle } from "@/db/schema";
import type { BagWithProduct } from "@/db/queries";
import { formatWeight } from "@/lib/format";
import {
  getGeometry,
  VIEW_H,
  VIEW_W,
  zoneLayouts,
  type BikeGeometry,
  type DiagramZone,
  type Point,
} from "./geometry";

const INK = "var(--ink)";
const MUTED = "var(--muted)";
const FAINT = "var(--faint)";
const BLUEPRINT = "var(--blueprint)";
const ACCENT = "var(--accent)";
const BAG_FILL = "var(--surface)";

const ZONES: DiagramZone[] = [
  "handlebar",
  "stem",
  "toptube",
  "frame",
  "downtube",
  "fork_left",
  "fork_right",
  "saddle",
  "rear_rack",
];

/** Round to 2 decimals — keeps SSR and client output byte-identical
 * (transcendental functions can differ between V8 versions). */
const r2 = (n: number) => Math.round(n * 100) / 100;

function angleDeg(a: Point, b: Point) {
  return r2((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
}

function Wheel({ center, g }: { center: Point; g: BikeGeometry }) {
  const [cx, cy] = center;
  const spokeCount = 12;
  const spokes = Array.from({ length: spokeCount }, (_, i) => {
    const a = (i / spokeCount) * Math.PI * 2 + 0.26;
    return (
      <line
        key={i}
        x1={r2(cx + Math.cos(a) * 8)}
        y1={r2(cy + Math.sin(a) * 8)}
        x2={r2(cx + Math.cos(a) * g.rimRadius)}
        y2={r2(cy + Math.sin(a) * g.rimRadius)}
        stroke={FAINT}
        strokeWidth={1}
      />
    );
  });
  return (
    <g>
      {/* tire */}
      <circle
        cx={cx}
        cy={cy}
        r={g.wheelRadius - g.tireStroke / 2}
        fill="none"
        stroke={INK}
        strokeWidth={g.tireStroke}
        opacity={0.9}
      />
      {/* rim */}
      <circle
        cx={cx}
        cy={cy}
        r={g.rimRadius}
        fill="none"
        stroke={MUTED}
        strokeWidth={2.5}
        opacity={0.75}
      />
      {spokes}
      {/* hub */}
      <circle cx={cx} cy={cy} r={7} fill="var(--background)" stroke={MUTED} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={2} fill={MUTED} />
    </g>
  );
}

function Frame({ g, color }: { g: BikeGeometry; color: string }) {
  const tube = { stroke: color, strokeWidth: 9, strokeLinecap: "round" as const, fill: "none" };
  const stay = { ...tube, strokeWidth: 5 };
  return (
    <g>
      {/* chainstay + seatstay */}
      <line x1={g.bb[0]} y1={g.bb[1]} x2={g.rearAxle[0]} y2={g.rearAxle[1]} {...stay} />
      <line x1={g.rearAxle[0]} y1={g.rearAxle[1]} x2={g.seatCluster[0]} y2={g.seatCluster[1]} {...stay} />
      {/* main triangle */}
      <line x1={g.bb[0]} y1={g.bb[1]} x2={g.seatCluster[0]} y2={g.seatCluster[1]} {...tube} strokeWidth={7.5} />
      <line x1={g.seatCluster[0]} y1={g.seatCluster[1]} x2={g.headTop[0]} y2={g.headTop[1]} {...tube} strokeWidth={8} />
      <line x1={g.bb[0]} y1={g.bb[1]} x2={g.headBottom[0]} y2={g.headBottom[1]} {...tube} strokeWidth={10} />
      <line x1={g.headTop[0]} y1={g.headTop[1]} x2={g.headBottom[0]} y2={g.headBottom[1]} {...tube} strokeWidth={11} />
      {/* fork */}
      {g.suspension ? (
        <>
          {/* stanchion + crown */}
          <line
            x1={g.headBottom[0]}
            y1={g.headBottom[1]}
            x2={mid(g.headBottom, g.frontAxle, 0.45)[0]}
            y2={mid(g.headBottom, g.frontAxle, 0.45)[1]}
            stroke={color}
            strokeWidth={9}
            strokeLinecap="round"
          />
          {/* lower legs */}
          <line
            x1={mid(g.headBottom, g.frontAxle, 0.38)[0]}
            y1={mid(g.headBottom, g.frontAxle, 0.38)[1]}
            x2={g.frontAxle[0]}
            y2={g.frontAxle[1]}
            stroke={INK}
            strokeWidth={13}
            strokeLinecap="round"
            opacity={0.85}
          />
        </>
      ) : (
        <path
          d={`M ${g.headBottom[0]} ${g.headBottom[1]} Q ${g.headBottom[0] + 6} ${(g.headBottom[1] + g.frontAxle[1]) / 2 + 16} ${g.frontAxle[0]} ${g.frontAxle[1]}`}
          stroke={color}
          strokeWidth={6.5}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  );
}

function mid(a: Point, b: Point, t = 0.5): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function Cockpit({ g }: { g: BikeGeometry }) {
  const [hx, hy] = g.headTop;
  const [cx, cy] = g.barClamp;
  return (
    <g>
      {/* steerer spacers + stem */}
      <line x1={hx} y1={hy} x2={hx - (hx - cx) * 0.12} y2={hy - 12} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <line x1={hx - (hx - cx) * 0.12} y1={hy - 12} x2={cx} y2={cy} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      {g.barType === "drop" ? (
        <>
          {/* drop bar: forward reach, then the drop curl */}
          <path
            d={`M ${cx} ${cy} h 22 c 15 1 21 8 21 20 c 0 15 -11 23 -23 21`}
            stroke={INK}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          {/* brake hood */}
          <line x1={cx + 40} y1={cy + 2} x2={cx + 52} y2={cy + 10} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1={cx - 18} y1={cy + 3} x2={cx + 26} y2={cy - 3} stroke={INK} strokeWidth={5.5} strokeLinecap="round" />
          {/* brake lever */}
          <line x1={cx - 10} y1={cy + 4} x2={cx - 20} y2={cy + 12} stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

function SaddleAssembly({ g }: { g: BikeGeometry }) {
  const [sx, sy] = g.saddleCenter;
  const half = g.saddleLength / 2;
  return (
    <g>
      {/* seatpost */}
      <line
        x1={g.seatCluster[0]}
        y1={g.seatCluster[1]}
        x2={sx + 4}
        y2={sy + 3}
        stroke={INK}
        strokeWidth={5}
        strokeLinecap="round"
      />
      {/* saddle: nose forward (right), slightly kicked tail */}
      <path
        d={`M ${sx - half} ${sy - 3}
            Q ${sx - half + 12} ${sy - 9} ${sx - 8} ${sy - 6}
            Q ${sx + half * 0.55} ${sy - 4} ${sx + half} ${sy + 2}
            Q ${sx + half * 0.5} ${sy + 6} ${sx - 6} ${sy + 5}
            Q ${sx - half + 8} ${sy + 6} ${sx - half} ${sy - 3} Z`}
        fill={INK}
      />
    </g>
  );
}

function Drivetrain({ g }: { g: BikeGeometry }) {
  const [bx, by] = g.bb;
  const [rx, ry] = g.rearAxle;
  const ringR = 24;
  const cassR = 13;
  return (
    <g>
      {/* chain */}
      <line x1={bx} y1={by - ringR} x2={rx} y2={ry - cassR} stroke={MUTED} strokeWidth={1.5} opacity={0.5} />
      <line x1={bx} y1={by + ringR} x2={rx} y2={ry + cassR} stroke={MUTED} strokeWidth={1.5} opacity={0.5} />
      {/* cassette */}
      <circle cx={rx} cy={ry} r={cassR} fill="none" stroke={MUTED} strokeWidth={2} opacity={0.6} />
      {/* chainring */}
      <circle cx={bx} cy={by} r={ringR} fill="none" stroke={MUTED} strokeWidth={2.5} opacity={0.8} />
      <circle cx={bx} cy={by} r={4} fill="none" stroke={MUTED} strokeWidth={2} />
      {/* crank arm + pedal */}
      <line x1={bx} y1={by} x2={bx + 17} y2={by + 30} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <line x1={bx + 9} y1={by + 32} x2={bx + 27} y2={by + 29} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      {/* rear derailleur hint */}
      <line x1={rx} y1={ry + cassR} x2={rx + 3} y2={ry + cassR + 10} stroke={MUTED} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
    </g>
  );
}

function Rack({ g }: { g: BikeGeometry }) {
  const y = g.rearAxle[1] - g.wheelRadius - 10;
  const x0 = g.rearAxle[0] - 62;
  const x1 = g.rearAxle[0] + 46;
  return (
    <g stroke={INK} strokeWidth={2.5} strokeLinecap="round" opacity={0.75} fill="none">
      <line x1={x0} y1={y} x2={x1} y2={y} />
      <line x1={x0} y1={y + 5} x2={x1 - 4} y2={y + 5} />
      <line x1={x0 + 8} y1={y} x2={g.rearAxle[0] - 2} y2={g.rearAxle[1] - 8} />
      <line x1={x1 - 8} y1={y} x2={g.rearAxle[0] + g.wheelRadius * 0.55} y2={g.rearAxle[1] - g.wheelRadius * 0.5} />
    </g>
  );
}

/** Blueprint-style dimension line under the bike. */
function DimensionLine({ g, label }: { g: BikeGeometry; label: string }) {
  const y = g.groundY + 26;
  const midX = (g.rearAxle[0] + g.frontAxle[0]) / 2;
  return (
    <g stroke={BLUEPRINT} strokeWidth={1} opacity={0.7}>
      <line x1={g.rearAxle[0]} y1={y - 6} x2={g.rearAxle[0]} y2={y + 6} />
      <line x1={g.frontAxle[0]} y1={y - 6} x2={g.frontAxle[0]} y2={y + 6} />
      <line x1={g.rearAxle[0]} y1={y} x2={midX - 48} y2={y} />
      <line x1={midX + 48} y1={y} x2={g.frontAxle[0]} y2={y} />
      <text
        x={midX}
        y={y + 3.5}
        textAnchor="middle"
        stroke="none"
        fill={BLUEPRINT}
        style={{ font: "600 10px var(--font-mono)", letterSpacing: "0.12em" }}
      >
        {label}
      </text>
    </g>
  );
}

function BagShape({ zone, g }: { zone: DiagramZone; g: BikeGeometry }) {
  const layouts = zoneLayouts(g);
  const common = {
    fill: BAG_FILL,
    stroke: INK,
    strokeWidth: 2.5,
    strokeLinejoin: "round" as const,
  };

  switch (zone) {
    case "handlebar": {
      // roll seen from the side: rounded body + strap hints
      const [cx, cy] = layouts.handlebar.anchor;
      return (
        <g>
          <rect x={cx - 44} y={cy - 22} width={88} height={44} rx={21} {...common} />
          <line x1={cx - 16} y1={cy - 21} x2={cx - 16} y2={cy + 21} stroke={INK} strokeWidth={1.5} opacity={0.4} />
          <line x1={cx + 16} y1={cy - 21} x2={cx + 16} y2={cy + 21} stroke={INK} strokeWidth={1.5} opacity={0.4} />
        </g>
      );
    }
    case "stem": {
      const [cx, cy] = layouts.stem.anchor;
      return <rect x={cx - 12} y={cy - 16} width={24} height={36} rx={10} {...common} />;
    }
    case "toptube": {
      const [cx, cy] = layouts.toptube.anchor;
      const deg = angleDeg(g.seatCluster, g.headTop);
      return (
        <rect
          x={cx - 35}
          y={cy - 12}
          width={70}
          height={26}
          rx={10}
          transform={`rotate(${deg} ${cx} ${cy})`}
          {...common}
        />
      );
    }
    case "frame": {
      const inset = (p: Point, c: Point, d = 16): Point => [
        r2(p[0] + ((c[0] - p[0]) / Math.hypot(c[0] - p[0], c[1] - p[1])) * d),
        r2(p[1] + ((c[1] - p[1]) / Math.hypot(c[0] - p[0], c[1] - p[1])) * d),
      ];
      const c: Point = [
        (g.bb[0] + g.seatCluster[0] + g.headBottom[0]) / 3,
        (g.bb[1] + g.seatCluster[1] + g.headBottom[1]) / 3,
      ];
      const a = inset(g.seatCluster, c);
      const b = inset(g.headBottom, c);
      const d = inset(g.bb, c);
      return (
        <g>
          <path d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${d[0]} ${d[1]} Z`} {...common} />
          {/* zipper hint */}
          <line
            x1={mid(a, d, 0.2)[0]}
            y1={mid(a, d, 0.2)[1]}
            x2={mid(b, d, 0.25)[0]}
            y2={mid(b, d, 0.25)[1]}
            stroke={INK}
            strokeWidth={1.5}
            opacity={0.35}
            strokeDasharray="4 3"
          />
        </g>
      );
    }
    case "downtube": {
      const [cx, cy] = layouts.downtube.anchor;
      const deg = angleDeg(g.bb, g.headBottom);
      return (
        <rect
          x={cx - 30}
          y={cy - 11}
          width={60}
          height={22}
          rx={10}
          transform={`rotate(${deg} ${cx} ${cy})`}
          {...common}
        />
      );
    }
    case "fork_left":
    case "fork_right": {
      const [cx, cy] = layouts[zone].anchor;
      return (
        <g>
          <rect x={cx - 12} y={cy - 30} width={24} height={60} rx={10} {...common} />
          <line x1={cx - 11} y1={cy - 10} x2={cx + 11} y2={cy - 10} stroke={INK} strokeWidth={1.5} opacity={0.4} />
          <line x1={cx - 11} y1={cy + 10} x2={cx + 11} y2={cy + 10} stroke={INK} strokeWidth={1.5} opacity={0.4} />
        </g>
      );
    }
    case "saddle": {
      // seat pack: fat at the saddle rails, tapering backwards
      const sx = g.saddleCenter[0] - g.saddleLength / 2 + 6;
      const sy = g.saddleCenter[1] + 4;
      return (
        <path
          d={`M ${sx} ${sy - 10}
              C ${sx - 42} ${sy - 22} ${sx - 86} ${sy - 14} ${sx - 100} ${sy + 2}
              C ${sx - 104} ${sy + 8} ${sx - 98} ${sy + 16} ${sx - 88} ${sy + 17}
              C ${sx - 54} ${sy + 22} ${sx - 14} ${sy + 18} ${sx + 2} ${sy + 12} Z`}
          {...common}
        />
      );
    }
    case "rear_rack": {
      const [cx, cy] = layouts.rear_rack.anchor;
      return (
        <g>
          <rect x={cx - 52} y={cy - 20} width={104} height={40} rx={16} {...common} />
          <line x1={cx - 20} y1={cy - 19} x2={cx - 20} y2={cy + 19} stroke={INK} strokeWidth={1.5} opacity={0.4} />
          <line x1={cx + 20} y1={cy - 19} x2={cx + 20} y2={cy + 19} stroke={INK} strokeWidth={1.5} opacity={0.4} />
        </g>
      );
    }
  }
}

function BagLabel({
  zone,
  g,
  items,
}: {
  zone: DiagramZone;
  g: BikeGeometry;
  items: { name: string; weightGrams: number | null }[];
}) {
  const layout = zoneLayouts(g)[zone];
  const [ax, ay] = layout.anchor;
  const [lx, ly] = layout.label;
  const end = layout.labelAlign;
  const bendX = end === "start" ? lx - 8 : lx + 8;
  const lineH = 15;
  return (
    <g>
      <circle cx={ax} cy={ay} r={2.5} fill={BLUEPRINT} />
      <path
        d={`M ${ax} ${ay} L ${bendX} ${ly + (ly < ay ? 4 : -4)}`}
        stroke={BLUEPRINT}
        strokeWidth={1}
        fill="none"
        opacity={0.6}
      />
      {items.map((item, i) => {
        const rowY = ly + i * lineH;
        return (
          <g key={`${item.name}-${i}`}>
            <text
              x={lx}
              y={rowY}
              textAnchor={end}
              fill={INK}
              style={{ font: "500 12.5px var(--font-sans)" }}
            >
              {item.name}
              {item.weightGrams != null ? (
                <tspan
                  fill={MUTED}
                  style={{ font: "400 10.5px var(--font-mono)", letterSpacing: "0.05em" }}
                >
                  {`  ${formatWeight(item.weightGrams)}`}
                </tspan>
              ) : null}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function BikeDiagram({
  bikeStyle,
  color,
  bags,
  tireMm,
  selectedZone,
  onZoneSelect,
  labels = true,
  className,
}: {
  bikeStyle: BikeStyle;
  color: string;
  bags: BagWithProduct[];
  /** Tyre width (mm) of the selected wheelset — overrides the style default */
  tireMm?: number | null;
  selectedZone?: DiagramZone | null;
  onZoneSelect?: (zone: DiagramZone) => void;
  labels?: boolean;
  className?: string;
}) {
  const g = getGeometry(bikeStyle, tireMm);
  const layouts = zoneLayouts(g);
  const byZone = new Map<DiagramZone, BagWithProduct[]>();
  for (const b of bags) {
    const zone = b.mountPoint as DiagramZone;
    const list = byZone.get(zone);
    if (list) list.push(b);
    else byZone.set(zone, [b]);
  }
  const interactive = Boolean(onZoneSelect);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-label={`${bikeStyle} bike diagram with ${bags.length} mounted item${bags.length === 1 ? "" : "s"}`}
    >
      {/* ground */}
      <line
        x1={40}
        y1={g.groundY}
        x2={VIEW_W - 40}
        y2={g.groundY}
        stroke={FAINT}
        strokeWidth={1}
        strokeDasharray="1 6"
        strokeLinecap="round"
      />
      <Wheel center={g.rearAxle} g={g} />
      <Wheel center={g.frontAxle} g={g} />
      {g.rack ? <Rack g={g} /> : null}
      <Drivetrain g={g} />
      <Frame g={g} color={color} />
      <SaddleAssembly g={g} />
      <Cockpit g={g} />
      <DimensionLine g={g} label={bikeStyle.toUpperCase()} />

      {/* mounted bags + accessories + labels */}
      {ZONES.map((zone) => {
        const mounted = byZone.get(zone);
        if (!mounted || mounted.length === 0) return null;
        const hasBag = mounted.some((m) => m.product.category === "bag");
        const [cx, cy] = layouts[zone].anchor;
        return (
          <g
            key={zone}
            onClick={interactive ? () => onZoneSelect?.(zone) : undefined}
            className={interactive ? "cursor-pointer" : undefined}
            opacity={selectedZone && selectedZone !== zone ? 0.45 : 1}
            style={{ transition: "opacity 150ms" }}
          >
            {hasBag ? (
              <BagShape zone={zone} g={g} />
            ) : (
              // accessories only — a compact marker instead of a bag silhouette
              <g>
                <circle
                  cx={cx}
                  cy={cy}
                  r={11}
                  fill={BAG_FILL}
                  stroke={INK}
                  strokeWidth={2.5}
                />
                {mounted.length > 1 ? (
                  <text
                    x={cx}
                    y={cy + 3.5}
                    textAnchor="middle"
                    fill={INK}
                    style={{ font: "600 10px var(--font-mono)" }}
                  >
                    {mounted.length}
                  </text>
                ) : (
                  <circle cx={cx} cy={cy} r={3} fill={ACCENT} />
                )}
              </g>
            )}
            {labels ? (
              <BagLabel
                zone={zone}
                g={g}
                items={mounted.map((m) => ({
                  name: m.product.name,
                  weightGrams: m.product.weightGrams,
                }))}
              />
            ) : null}
          </g>
        );
      })}

      {/* empty zone markers */}
      {interactive
        ? ZONES.filter((z) => !byZone.has(z)).map((zone) => {
            const [cx, cy] = layouts[zone].anchor;
            const selected = selectedZone === zone;
            return (
              <g key={zone} onClick={() => onZoneSelect?.(zone)} className="group cursor-pointer">
                <circle cx={cx} cy={cy} r={20} fill="transparent" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={13}
                  fill="var(--background)"
                  stroke={selected ? ACCENT : FAINT}
                  strokeWidth={1.5}
                  strokeDasharray={selected ? "none" : "3 3"}
                  className="transition-colors group-hover:stroke-(--accent)"
                />
                <path
                  d={`M ${cx - 5} ${cy} h 10 M ${cx} ${cy - 5} v 10`}
                  stroke={selected ? ACCENT : MUTED}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  className="transition-colors group-hover:stroke-(--accent)"
                />
              </g>
            );
          })
        : null}
    </svg>
  );
}
