import { BUILDINGS, COLMADO_TABLES, PARK } from './losRobles.js';
import { GENERATED_SPRITES } from './generatedSprites.js';
import { findIntersections } from './terrain.js';

// Decoration is data: every object has a type and a tile position. Types decide appearance,
// solid size (for collision and depth sorting) and which surfaces they may stand on.

/** Props that are not generated sprites. `solid: null` = flat ground decal (walkable, always under actors). */
export const SPECIAL_TYPES = Object.freeze({
  mango: { solid: [0.9, 0.9], on: ['park', 'paving'], render: { kind: 'png', key: 'mango-tree-pixel', anchor: [603, 1180], scale: 0.25 } },
  palm: { solid: [0.6, 0.6], on: ['grass', 'park', 'paving'], render: { kind: 'svg', key: 'palm', origin: [0.5, 0.91], scale: 0.85 } },
  lamp: { solid: [0.34, 0.34], on: ['sidewalk', 'paving', 'park', 'park_path', 'grass'], render: { kind: 'lamp', height: 118 } },
  bush: { solid: [1.3, 0.7], on: ['grass', 'park', 'paving'], render: { kind: 'bush' } },
  flowerbed: { solid: null, on: ['grass', 'park'], render: { kind: 'flowerbed' } },
  drain: { solid: null, on: ['road'], render: { kind: 'drain' } }
});

/** Scale applied to a generated sprite's footprint to obtain its blocking rect (chairs/gaps stay walkable). */
const SOLID_SHRINK = { 'domino-table-white': 0.82, 'domino-table-red': 0.82 };
const GENERATED_ON = (type) => type.startsWith('car-') ? ['road'] : type === 'bin' ? ['sidewalk', 'paving', 'park', 'park_path'] : ['paving', 'park', 'park_path', 'sidewalk', 'grass'];

export function propSpec(type) {
  if (SPECIAL_TYPES[type]) return { type, ...SPECIAL_TYPES[type] };
  const g = GENERATED_SPRITES[type];
  if (!g) throw new Error(`Unknown prop type: ${type}`);
  const k = SOLID_SHRINK[type] ?? 1;
  return { type, solid: [g.footprint.w * k, g.footprint.d * k], on: GENERATED_ON(type), render: { kind: 'generated', key: type } };
}

// ---- curated placement -------------------------------------------------------------------------------------------
const P = (type, x, y) => ({ type, x, y });

const MANUAL = [
  // Park Los Robles — a designed public space: central mango with benches facing it, lamps at the plaza corners,
  // two domino pads, flower beds flanking the entrances, bins by the paths, palms in the corners.
  P('mango', PARK.center.x, PARK.center.y),
  P('bench-s', 31.8, 22.55), P('bench-s', 36.2, 22.55), P('bench-n', 31.8, 27.45), P('bench-n', 36.2, 27.45),
  P('lamp', 30.4, 22.4), P('lamp', 37.6, 22.4), P('lamp', 30.4, 27.6), P('lamp', 37.6, 27.6),
  P('domino-table-white', 28, 22.6), P('domino-table-red', 40, 27.4),
  P('flowerbed', 31.3, 20.7), P('flowerbed', 36.7, 20.7), P('flowerbed', 31.3, 29.3), P('flowerbed', 36.7, 29.3),
  P('flowerbed', 27.4, 28.2), P('flowerbed', 40.6, 22.4), P('flowerbed', 25.9, 25.0 + 2.6), P('flowerbed', 42.0, 21.0),
  P('palm', 25.6, 20.6), P('palm', 42.4, 20.6), P('palm', 25.6, 29.4), P('palm', 42.4, 29.4),
  P('bush', 28.6, 20.6), P('bush', 40.6, 20.6), P('bush', 29.0, 29.2), P('bush', 38.6, 29.3),
  P('bin', 32.5, 21.6), P('bin', 35.5, 28.4),

  // Colmado Don Ramón — the social heart: two domino tables flank the entrance on the front plaza.
  ...COLMADO_TABLES.map(t => P(`domino-table-${t.variant}`, t.x, t.y)),
  P('bin', 27.6, 45.6), P('bin', 41.6, 45.6),
  P('lamp', 28.4, 44.4), P('lamp', 40.6, 44.4),
  P('palm', 26.4, 37.0), P('palm', 41.6, 37.0), P('bush', 27.2, 41.0), P('bush', 41.0, 41.0),

  // Residential yards
  P('palm', 7.3, 6.4), P('palm', 13.7, 8.6), P('bush', 7.6, 12.4), P('bush', 13.4, 12.8),
  P('palm', 17.0, 9.6), P('palm', 17.4, 6.0), P('bush', 16.8, 13.4),
  P('palm', 30.7, 5.6), P('bush', 31.15, 13.2),
  P('palm', 32.8, 9.0), P('bush', 33.4, 13.4), P('palm', 33.0, 5.4),
  P('palm', 36.4, 6.0), P('palm', 43.4, 7.4), P('bush', 36.4, 12.2), P('bush', 43.4, 12.8),
  P('palm', 46.6, 8.6), P('bush', 47.0, 13.4),
  P('palm', 51.4, 6.4), P('palm', 58.8, 6.6), P('bin', 57.6, 14.4), P('lamp', 49.6, 13.6),
  P('palm', 62.6, 9.0), P('palm', 64.6, 13.0), P('bush', 63.0, 5.8), P('palm', 5.4, 8.4),
  P('palm', 9.3, 22.4), P('bush', 10.2, 28.6), P('bush', 13.0, 28.8), P('bush', 17.5, 21.8), P('bush', 17.5, 27.3),
  P('palm', 61.4, 24.0), P('palm', 61.4, 27.8), P('palm', 49.0, 24.4), P('bush', 49.2, 27.6), P('bush', 49.4, 21.2),
  P('lamp', 51.2, 29.4), P('bin', 60.6, 29.4),
  P('palm', 10.4, 38.2), P('palm', 18.4, 39.6), P('bush', 10.6, 45.2), P('bush', 18.6, 45.4), P('bush', 10.4, 42.0),
  P('palm', 49.6, 38.2), P('palm', 60.8, 38.4), P('palm', 60.6, 43.2), P('bush', 50.2, 45.4), P('bush', 59.4, 45.6), P('bush', 50.2, 41.2),

  // Parked cars: outer lane of each street, aligned with the lane axis, clear of junctions, crossings and door paths.
  P('car-red-x-front', 11.5, 16.7), P('car-blue-x-rear', 29.5, 33.3), P('car-white-y-front', 23.3, 26.0),
  P('car-red-y-rear', 44.7, 39.5), P('car-blue-x-front', 27.0, 48.7), P('car-white-y-rear', 64.7, 24.0),

  // Storm drains in the gutters
  P('drain', 15.0, 18.78), P('drain', 51.5, 16.22), P('drain', 35.0, 33.8), P('drain', 56.0, 31.2), P('drain', 14.0, 50.8), P('drain', 52.0, 48.2)
];

/** Two lamps per junction between the interior vertical streets and every avenue, on the outer sidewalk corners. */
function streetLamps() {
  const out = [];
  for (const j of findIntersections().filter(j => j.v === 'V1' || j.v === 'V2')) {
    out.push(P('lamp', j.x - 0.72, j.y - 0.72), P('lamp', j.x + j.w + 0.72, j.y + j.d + 0.72));
  }
  return out;
}

let uid = 0;
export function buildProps() {
  return [...MANUAL, ...streetLamps()].map(p => {
    const spec = propSpec(p.type);
    const solid = spec.solid ? { x0: p.x - spec.solid[0] / 2, y0: p.y - spec.solid[1] / 2, x1: p.x + spec.solid[0] / 2, y1: p.y + spec.solid[1] / 2 } : null;
    return { id: `${p.type}#${uid++}`, type: p.type, x: p.x, y: p.y, spec, solid };
  });
}

/** Low masonry walls around house plots. The gate gap is the paved path (or the door) of each house. */
export function buildFences() {
  const T = 0.2, out = [];
  for (const b of BUILDINGS.filter(b => b.fence)) {
    const { x, y, w, d } = b.plot;
    const gate = b.path[0] ?? { x: b.door.x - 1, w: 2 };
    const seg = (n, x0, y0, x1, y1) => out.push({ id: `fence:${b.id}:${n}`, building: b.id, x0, y0, x1, y1 });
    seg('front-w', x, y + d - T, gate.x, y + d); seg('front-e', gate.x + gate.w, y + d - T, x + w, y + d);
    seg('west', x, y, x + T, y + d - T); seg('east', x + w - T, y, x + w, y + d - T); seg('back', x + T, y, x + w - T, y + T);
  }
  return out;
}
