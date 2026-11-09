import { BUILDINGS, PARK, PLAYABLE, ROADS, WORLD } from './losRobles.js';

// Pure (Phaser-free) derivation of the ground plan from the data in losRobles.js.
export const KIND = Object.freeze({ GRASS: 0, ROAD: 1, SIDEWALK: 2, PAVING: 3, PARK: 4, PARK_PATH: 5 });
export const KIND_NAME = Object.freeze(Object.fromEntries(Object.entries(KIND).map(([k, v]) => [v, k.toLowerCase()])));

export const inGrid = (x, y) => x >= 0 && y >= 0 && x < WORLD.columns && y < WORLD.rows;
export const inPlayable = (x, y) => x >= PLAYABLE.x0 && y >= PLAYABLE.y0 && x < PLAYABLE.x1 && y < PLAYABLE.y1;
export const rectContains = (r, x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.d;

function fill(kinds, rect, kind, only = null) {
  for (let y = Math.floor(rect.y); y < Math.ceil(rect.y + rect.d); y++) for (let x = Math.floor(rect.x); x < Math.ceil(rect.x + rect.w); x++) {
    if (!inGrid(x, y)) continue;
    const i = y * WORLD.columns + x;
    if (only && !only.includes(kinds[i])) continue;
    kinds[i] = kind;
  }
}

export function buildTerrain() {
  const { columns, rows } = WORLD;
  const kinds = new Uint8Array(columns * rows).fill(KIND.GRASS);
  const at = (x, y) => (inGrid(x, y) ? kinds[y * columns + x] : -1);

  for (const road of ROADS) fill(kinds, road, KIND.ROAD);

  // Sidewalks hug every road cell (8-neighbourhood, so corners are closed) inside the playable area.
  const sidewalk = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    if (at(x, y) !== KIND.ROAD) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (inPlayable(nx, ny) && at(nx, ny) !== KIND.ROAD) sidewalk.push(ny * columns + nx);
    }
  }
  for (const i of sidewalk) kinds[i] = KIND.SIDEWALK;

  // Plot ground (never overwrites street surfaces) and the paved walkways that tie each door to the street.
  for (const b of BUILDINGS) {
    fill(kinds, b.plot, b.ground === 'paving' ? KIND.PAVING : KIND.GRASS, [KIND.GRASS]);
    for (const p of b.path) fill(kinds, p, KIND.PAVING, [KIND.GRASS, KIND.PAVING]);
  }
  fill(kinds, PARK.rect, KIND.PARK, [KIND.GRASS]);
  fill(kinds, PARK.plaza, KIND.PAVING);
  for (const p of PARK.paths) fill(kinds, p, KIND.PARK_PATH);
  for (const p of PARK.pads) fill(kinds, p, KIND.PAVING);

  return { kinds, columns, rows, at, kindAt: (x, y) => at(Math.floor(x), Math.floor(y)) };
}

/** Cells where a horizontal and a vertical street overlap. */
export function findIntersections() {
  const out = [];
  for (const h of ROADS.filter(r => r.axis === 'x')) for (const v of ROADS.filter(r => r.axis === 'y')) {
    const x0 = Math.max(h.x, v.x), x1 = Math.min(h.x + h.w, v.x + v.w);
    const y0 = Math.max(h.y, v.y), y1 = Math.min(h.y + h.d, v.y + v.d);
    if (x1 > x0 && y1 > y0) out.push({ id: `${h.id}×${v.id}`, h: h.id, v: v.id, x: x0, y: y0, w: x1 - x0, d: y1 - y0 });
  }
  return out;
}

/**
 * Road markings with a traffic function:
 *  - one dashed yellow centre line per street (separates the two directions), interrupted at every junction;
 *  - zebra crossings on each arm leaving a junction;
 *  - a yellow-curbed bus bay in front of the bus station.
 */
export function buildMarkings(terrain) {
  const junctions = findIntersections();
  const isRoad = (x, y) => terrain.at(x, y) === KIND.ROAD;
  const inJunction = (x, y) => junctions.some(j => rectContains(j, x, y));
  const centerLines = [];
  for (const road of ROADS) {
    const mid = road.axis === 'x' ? road.y + road.d / 2 : road.x + road.w / 2;
    const from = road.axis === 'x' ? road.x : road.y, to = road.axis === 'x' ? road.x + road.w : road.y + road.d;
    let start = null;
    for (let n = from; n <= to; n++) {
      // A dash cell is clear when it lies outside any junction (and the cell beside a junction keeps the crossing free).
      const cell = road.axis === 'x' ? [n, Math.floor(mid)] : [Math.floor(mid), n];
      const prev = road.axis === 'x' ? [n - 1, cell[1]] : [cell[0], n - 1], next = road.axis === 'x' ? [n + 1, cell[1]] : [cell[0], n + 1];
      const clear = n < to && !inJunction(...cell) && !inJunction(...prev) && !inJunction(...next);
      if (clear && start === null) start = n;
      if (!clear && start !== null) { centerLines.push({ road: road.id, axis: road.axis, at: mid, from: start, to: n }); start = null; }
    }
  }
  const crosswalks = [];
  for (const j of junctions) {
    for (let k = 0; k < j.d; k++) { // arms along the horizontal street
      if (isRoad(j.x - 1, j.y + k)) crosswalks.push({ axis: 'x', x: j.x - 1, y: j.y + k });
      if (isRoad(j.x + j.w, j.y + k)) crosswalks.push({ axis: 'x', x: j.x + j.w, y: j.y + k });
    }
    for (let k = 0; k < j.w; k++) { // arms along the vertical street
      if (isRoad(j.x + k, j.y - 1)) crosswalks.push({ axis: 'y', x: j.x + k, y: j.y - 1 });
      if (isRoad(j.x + k, j.y + j.d)) crosswalks.push({ axis: 'y', x: j.x + k, y: j.y + j.d });
    }
  }
  const bays = BUILDINGS.filter(b => b.bay).map(b => ({ id: b.id, ...b.bay }));
  return { junctions, centerLines, crosswalks, bays };
}
