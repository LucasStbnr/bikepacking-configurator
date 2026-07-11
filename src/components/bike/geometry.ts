import type { BikeStyle, MountPoint } from "@/db/schema";

export const VIEW_W = 800;
export const VIEW_H = 520;

export type Point = [number, number];

/**
 * Real-world frame geometry in millimetres (size M/54 equivalents), based on
 * typical published charts (geometrygeeks.bike / bikeinsights.com):
 * stack & reach from the BB, head/seat angles, wheelbase, chainstay, BB drop.
 * Everything is projected to SVG space with a single scale factor, so the
 * proportions (wheel size vs wheelbase, saddle height…) stay true to life.
 */
type StyleParamsMM = {
  tire: number; // tire section height (28 = road 28mm, 60 = 29x2.35 MTB)
  wheelbase: number;
  chainstay: number;
  bbDrop: number;
  stack: number;
  reach: number;
  headAngle: number; // degrees
  headTubeLen: number;
  seatAngle: number; // degrees
  seatTubeLen: number; // BB → top-tube junction
  saddleHeight: number; // BB → saddle along the seat tube
  stem: [number, number]; // headTop → bar clamp offset (mm, x forward / y up)
  barType: "drop" | "flat";
  suspension: boolean;
  rack: boolean;
};

const STYLE_PARAMS: Record<BikeStyle, StyleParamsMM> = {
  road: {
    // race road bike, ~Canyon Aeroad 2021 size M
    tire: 28,
    wheelbase: 995,
    chainstay: 410,
    bbDrop: 70,
    stack: 550,
    reach: 390,
    headAngle: 73,
    headTubeLen: 150,
    seatAngle: 73.5,
    seatTubeLen: 505,
    saddleHeight: 700,
    stem: [100, 25],
    barType: "drop",
    suspension: false,
    rack: false,
  },
  gravel: {
    // ~Canyon Grail / Salsa Warbird size M, 700x45
    tire: 45,
    wheelbase: 1035,
    chainstay: 425,
    bbDrop: 72,
    stack: 585,
    reach: 380,
    headAngle: 71.5,
    headTubeLen: 170,
    seatAngle: 73.5,
    seatTubeLen: 515,
    saddleHeight: 705,
    stem: [95, 30],
    barType: "drop",
    suspension: false,
    rack: false,
  },
  mtb: {
    // modern trail hardtail 29er, size M
    tire: 60,
    wheelbase: 1155,
    chainstay: 435,
    bbDrop: 55,
    stack: 625,
    reach: 460,
    headAngle: 66,
    headTubeLen: 110,
    seatAngle: 75.5,
    seatTubeLen: 430,
    saddleHeight: 730,
    stem: [55, 40],
    barType: "flat",
    suspension: true,
    rack: false,
  },
  touring: {
    // classic touring / randonneur, 700x38, long stays for pannier clearance
    tire: 38,
    wheelbase: 1065,
    chainstay: 460,
    bbDrop: 75,
    stack: 610,
    reach: 370,
    headAngle: 71.5,
    headTubeLen: 195,
    seatAngle: 73,
    seatTubeLen: 545,
    saddleHeight: 700,
    stem: [85, 40],
    barType: "drop",
    suspension: false,
    rack: true,
  },
};

const RIM_RADIUS_MM = 311; // 700c / 29" bead seat ≈ 622mm diameter
const SCALE = 0.36;
const GROUND_Y = 455;
const MARGIN_LEFT = 58;
const SADDLE_LENGTH_MM = 260;

const rad = (deg: number) => (deg * Math.PI) / 180;

export type BikeGeometry = {
  rearAxle: Point;
  frontAxle: Point;
  wheelRadius: number; // px, outer tire radius
  rimRadius: number; // px
  tireStroke: number; // px
  bb: Point;
  seatCluster: Point;
  headTop: Point;
  headBottom: Point;
  saddleCenter: Point;
  saddleLength: number; // px
  barClamp: Point;
  groundY: number;
  barType: "drop" | "flat";
  suspension: boolean;
  rack: boolean;
};

function computeGeometry(p: StyleParamsMM, tireOverrideMm?: number | null): BikeGeometry {
  const tire = tireOverrideMm && tireOverrideMm > 0 ? Math.min(tireOverrideMm, 90) : p.tire;
  const wheelR = RIM_RADIUS_MM + tire;
  const rcx = Math.sqrt(p.chainstay ** 2 - p.bbDrop ** 2);
  const bbHeight = wheelR - p.bbDrop;
  const bbX = MARGIN_LEFT + (rcx + wheelR) * SCALE;

  const X = (x: number) => bbX + x * SCALE;
  const Y = (y: number) => GROUND_Y - (bbHeight + y) * SCALE;
  const pt = (x: number, y: number): Point => [
    Math.round(X(x) * 10) / 10,
    Math.round(Y(y) * 10) / 10,
  ];

  const headBottomX = p.reach + p.headTubeLen * Math.cos(rad(p.headAngle));
  const headBottomY = p.stack - p.headTubeLen * Math.sin(rad(p.headAngle));
  const seatDirX = -Math.cos(rad(p.seatAngle));
  const seatDirY = Math.sin(rad(p.seatAngle));

  return {
    rearAxle: pt(-rcx, p.bbDrop),
    frontAxle: pt(p.wheelbase - rcx, p.bbDrop),
    wheelRadius: wheelR * SCALE,
    rimRadius: (RIM_RADIUS_MM - 15) * SCALE,
    tireStroke: tire * SCALE,
    bb: pt(0, 0),
    seatCluster: pt(p.seatTubeLen * seatDirX, p.seatTubeLen * seatDirY),
    headTop: pt(p.reach, p.stack),
    headBottom: pt(headBottomX, headBottomY),
    saddleCenter: pt(p.saddleHeight * seatDirX, p.saddleHeight * seatDirY + 20),
    saddleLength: SADDLE_LENGTH_MM * SCALE,
    barClamp: pt(p.reach + p.stem[0], p.stack + p.stem[1]),
    groundY: GROUND_Y,
    barType: p.barType,
    suspension: p.suspension,
    rack: p.rack,
  };
}

/**
 * Geometry for a style, optionally with the tyre width of the selected
 * wheelset (mm). The wheel diameter and tyre thickness follow the real tyre.
 */
export function getGeometry(style: BikeStyle, tireMm?: number | null): BikeGeometry {
  return computeGeometry(STYLE_PARAMS[style], tireMm);
}

const mid = (a: Point, b: Point, t = 0.5): Point => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

export type ZoneLayout = {
  /** Where the empty-zone marker and popover anchor sit */
  anchor: Point;
  /** Where the bag label text block goes when the zone is occupied */
  label: Point;
  labelAlign: "start" | "end";
};

/** On-bike zones (cargo and cyclist are handled outside the diagram). */
export type DiagramZone = Exclude<MountPoint, "cargo" | "cyclist">;

export function zoneLayouts(g: BikeGeometry): Record<DiagramZone, ZoneLayout> {
  const forkMid = mid(g.headBottom, g.frontAxle, 0.5);
  const tt = (t: number) => mid(g.seatCluster, g.headTop, t);
  return {
    handlebar: {
      anchor: [g.barClamp[0] + 34, g.barClamp[1] + 4],
      label: [g.barClamp[0] + 92, 66],
      labelAlign: "start",
    },
    stem: {
      anchor: [g.headTop[0] - 2, g.headTop[1] - 38],
      label: [g.headTop[0] + 34, 40],
      labelAlign: "start",
    },
    toptube: {
      anchor: [tt(0.62)[0], tt(0.62)[1] - 20],
      label: [tt(0.45)[0] - 30, 56],
      labelAlign: "end",
    },
    frame: {
      anchor: [
        (g.bb[0] + g.seatCluster[0] + g.headBottom[0]) / 3 + 6,
        (g.bb[1] + g.seatCluster[1] + g.headBottom[1]) / 3 + 2,
      ],
      label: [g.bb[0] - 46, VIEW_H - 18],
      labelAlign: "end",
    },
    downtube: {
      anchor: [mid(g.bb, g.headBottom, 0.5)[0] + 4, mid(g.bb, g.headBottom, 0.5)[1] + 28],
      label: [g.headBottom[0] + 64, VIEW_H - 18],
      labelAlign: "start",
    },
    fork_left: {
      anchor: [forkMid[0] - 26, forkMid[1] + 8],
      label: [g.frontAxle[0] + g.wheelRadius + 12, g.frontAxle[1] - g.wheelRadius - 6],
      labelAlign: "start",
    },
    fork_right: {
      anchor: [forkMid[0] + 24, forkMid[1] - 12],
      label: [g.frontAxle[0] + g.wheelRadius + 20, g.frontAxle[1] - g.wheelRadius + 44],
      labelAlign: "start",
    },
    saddle: {
      anchor: [g.saddleCenter[0] - g.saddleLength / 2 - 52, g.saddleCenter[1] + 16],
      label: [g.saddleCenter[0] - 138, 56],
      labelAlign: "end",
    },
    rear_rack: {
      anchor: [g.rearAxle[0] - 6, g.rearAxle[1] - g.wheelRadius - 34],
      label: [g.rearAxle[0] - g.wheelRadius - 4, 120],
      labelAlign: "end",
    },
  };
}
