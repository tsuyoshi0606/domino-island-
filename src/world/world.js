import { BUILDINGS, PARK } from './losRobles.js';
import { buildTerrain, buildMarkings } from './terrain.js';
import { buildFences, buildProps } from './props.js';
import { rectFrom } from './collision.js';
import { DepthSorter } from './depth.js';

/** Pure world model: terrain, markings, colliders, depth order and interaction zones. No Phaser imports. */
export function createWorld() {
  const terrain = buildTerrain();
  const markings = buildMarkings(terrain);
  const props = buildProps();
  const fences = buildFences();

  const bounds = (shapes) => {
    const rs = shapes.map(sh => rectFrom(sh));
    return { x0: Math.min(...rs.map(r => r.x0)), y0: Math.min(...rs.map(r => r.y0)), x1: Math.max(...rs.map(r => r.x1)), y1: Math.max(...rs.map(r => r.y1)) };
  };

  const buildings = BUILDINGS.map(b => ({ ...b, solidBounds: bounds(b.solid), center: { x: b.footprint.x + b.footprint.w / 2, y: b.footprint.y + b.footprint.d / 2 } }));

  const colliders = [
    ...buildings.flatMap(b => b.solid.map((s, i) => rectFrom(s, `${b.id}:solid${i}`, 'building'))),
    ...fences.map(f => ({ ...f, kind: 'fence' })),
    ...props.filter(p => p.solid).map(p => ({ id: p.id, kind: 'prop', ...p.solid }))
  ];

  // Everything that can hide an actor is a depth item (footprint = blocking rect).
  const items = [
    ...buildings.map(b => ({ id: b.id, ...b.solidBounds, frontSum: b.frontSum })),
    ...fences.map(f => ({ id: f.id, x0: f.x0, y0: f.y0, x1: f.x1, y1: f.y1 })),
    ...props.filter(p => p.solid).map(p => ({ id: p.id, ...p.solid }))
  ];
  const sorter = new DepthSorter(items);

  const interactions = buildings.filter(b => b.access).map(b => ({
    id: b.id, name: b.name, rect: rectFrom(b.access, `${b.id}:access`, 'interaction'), prompt: b.prompt ?? null, scene: b.interior ?? null
  }));

  return { terrain, markings, props, fences, buildings, colliders, sorter, interactions, park: PARK };
}
