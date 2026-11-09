import Phaser from 'phaser';
import { PLAYABLE, WORLD } from '../world/losRobles.js';
import { KIND, inPlayable } from '../world/terrain.js';

const PALETTE = {
  [KIND.GRASS]: [0x76a85e, 0x7ead64, 0x719d59],
  [KIND.ROAD]: [0x414247, 0x48494e],
  [KIND.SIDEWALK]: [0xd8c098, 0xe5cfaa],
  [KIND.PAVING]: [0xd8b88a, 0xe6c99b],
  [KIND.PARK]: [0x72a65d, 0x7db365],
  [KIND.PARK_PATH]: [0xe0c79a, 0xe9d3a8]
};
const EDGE = { [KIND.GRASS]: 0x658b51, [KIND.ROAD]: 0x393a3e, [KIND.SIDEWALK]: 0xc0a77d, [KIND.PAVING]: 0xc4a77b, [KIND.PARK]: 0x638b4e, [KIND.PARK_PATH]: 0xc9b088 };

export const GROUND_DEPTH = { terrain: -1000, curbs: -900, markings: -880, plots: -860, decals: -600, boundary: -50 };

function diamond(g, x, y, fill, edge) {
  const pts = [{ x, y }, { x: x + 32, y: y + 16 }, { x, y: y + 32 }, { x: x - 32, y: y + 16 }];
  g.fillStyle(fill, 1); g.fillPoints(pts, true);
  g.lineStyle(1, edge, 0.38); g.strokePoints(pts, true);
}

/** Iso edge of cell (x,y) facing neighbour direction (dx,dy): returns the two screen endpoints. */
function cellEdge(iso, x, y, dx, dy) {
  const top = iso.toScreen(x, y), right = iso.toScreen(x + 1, y), bottom = iso.toScreen(x + 1, y + 1), left = iso.toScreen(x, y + 1);
  if (dy === -1) return [top, right];
  if (dx === 1) return [right, bottom];
  if (dy === 1) return [left, bottom];
  return [top, left];
}

const quad = (iso, x0, y0, x1, y1) => [iso.toScreen(x0, y0), iso.toScreen(x1, y0), iso.toScreen(x1, y1), iso.toScreen(x0, y1)];

export function drawTerrain(scene, world, iso) {
  const { terrain, markings, buildings, park } = world;
  const ground = scene.add.graphics().setDepth(GROUND_DEPTH.terrain);
  for (let y = 0; y < WORLD.rows; y++) for (let x = 0; x < WORLD.columns; x++) {
    const kind = terrain.at(x, y);
    const palette = PALETTE[kind];
    const seed = (x * 17 + y * 31 + x * y) >>> 0;
    const p = iso.toScreen(x, y);
    let fill = palette[seed % palette.length];
    if (kind === KIND.GRASS && !inPlayable(x, y)) fill = Phaser.Display.Color.ValueToColor(fill).darken(10).color; // landscaped margin
    diamond(ground, p.x, p.y, fill, EDGE[kind]);
  }

  // Curbs: a light raised lip on the sidewalk side of every sidewalk/road boundary, with a dark gutter line on the road side.
  const curbs = scene.add.graphics().setDepth(GROUND_DEPTH.curbs);
  for (let y = 0; y < WORLD.rows; y++) for (let x = 0; x < WORLD.columns; x++) {
    if (terrain.at(x, y) !== KIND.SIDEWALK) continue;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      if (terrain.at(x + dx, y + dy) !== KIND.ROAD) continue;
      const [a, b] = cellEdge(iso, x, y, dx, dy);
      curbs.lineStyle(2, 0x2a2b2e, 1); curbs.lineBetween(a.x, a.y + 1, b.x, b.y + 1);
      curbs.lineStyle(3, 0xf0e2bf, 1); curbs.lineBetween(a.x, a.y - 1, b.x, b.y - 1);
    }
  }

  // Road markings with a function: dashed yellow centre line, zebra crossings, bus bay.
  const m = scene.add.graphics().setDepth(GROUND_DEPTH.markings);
  m.lineStyle(3, 0xe9b52f, 0.95);
  for (const line of markings.centerLines) {
    for (let n = line.from; n < line.to; n++) {
      const a = line.axis === 'x' ? iso.toScreen(n + 0.18, line.at) : iso.toScreen(line.at, n + 0.18);
      const b = line.axis === 'x' ? iso.toScreen(n + 0.68, line.at) : iso.toScreen(line.at, n + 0.68);
      m.lineBetween(a.x, a.y, b.x, b.y);
    }
  }
  for (const c of markings.crosswalks) {
    const bars = c.axis === 'x' ? [[0.1, 0.9, 0.12, 0.4], [0.1, 0.9, 0.6, 0.88]] : [[0.12, 0.4, 0.1, 0.9], [0.6, 0.88, 0.1, 0.9]];
    for (const [ax, bx, ay, by] of bars) { m.fillStyle(0xf2ead6, 0.92); m.fillPoints(quad(iso, c.x + ax, c.y + ay, c.x + bx, c.y + by), true); }
  }
  for (const bay of markings.bays) { // yellow-curbed bus bay along the sidewalk, white lane edge on the road side
    const a = iso.toScreen(bay.x, bay.y), b = iso.toScreen(bay.x + bay.w, bay.y);
    m.lineStyle(5, 0xe9b52f, 1); m.lineBetween(a.x, a.y, b.x, b.y);
    const c = iso.toScreen(bay.x, bay.y + bay.d), d = iso.toScreen(bay.x + bay.w, bay.y + bay.d);
    m.lineStyle(2, 0xf2ead6, 0.9); m.lineBetween(c.x, c.y, d.x, d.y);
    scene.add.text(...Object.values(iso.toScreen(bay.x + bay.w / 2, bay.y + 0.5)), 'PARADA', { fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#f2ead6' }).setOrigin(0.5).setAngle(26.5).setAlpha(0.85).setDepth(GROUND_DEPTH.markings + 1);
  }

  // Plot outlines: understated, so parcels read as lots without loud lines.
  const plots = scene.add.graphics().setDepth(GROUND_DEPTH.plots);
  const outline = (r, color, width, alpha) => { plots.lineStyle(width, color, alpha); plots.strokePoints([...quad(iso, r.x, r.y, r.x + r.w, r.y + r.d), iso.toScreen(r.x, r.y)], false); };
  for (const b of buildings) outline(b.plot, b.ground === 'paving' ? 0xb9985f : 0x587a46, 2, 0.75);
  outline(park.rect, 0xb9985f, 4, 0.95);
  return { ground, curbs, markings: m, plots };
}

/** Raised stone curb that frames the whole terrain so the edge of the district reads as intentional. */
export function drawWorldBoundary(scene, iso) {
  const g = scene.add.graphics().setDepth(GROUND_DEPTH.boundary);
  const c = [iso.toScreen(0, 0), iso.toScreen(WORLD.columns, 0), iso.toScreen(WORLD.columns, WORLD.rows), iso.toScreen(0, WORLD.rows)];
  g.lineStyle(18, 0x26352a, 1);
  for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; g.lineBetween(a.x, a.y + 12, b.x, b.y + 12); }
  g.lineStyle(12, 0x7d7569, 1); g.strokePoints([...c, c[0]], false);
  g.lineStyle(5, 0xcfc6b2, 1); g.strokePoints([...c, c[0]], false);
  return g;
}
