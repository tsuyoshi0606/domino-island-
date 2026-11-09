import { PLAYABLE } from '../world/losRobles.js';

/** Press C in the exterior scene: red = blocking colliders, green = interaction zones, yellow = art footprints, cyan = depth footprints. */
export function createDebugOverlay(scene, world, iso) {
  const g = scene.add.graphics().setDepth(90000).setVisible(false);
  const poly = (r, color, fillAlpha, width = 2) => {
    const pts = [iso.toScreen(r.x0, r.y0), iso.toScreen(r.x1, r.y0), iso.toScreen(r.x1, r.y1), iso.toScreen(r.x0, r.y1)];
    if (fillAlpha) { g.fillStyle(color, fillAlpha); g.fillPoints(pts, true); }
    g.lineStyle(width, color, 1); g.strokePoints([...pts, pts[0]], false);
  };
  for (const c of world.colliders) poly(c, c.kind === 'fence' ? 0xff8800 : 0xff2d2d, 0.28);
  for (const i of world.interactions) poly(i.rect, 0x35e06a, 0.3);
  for (const b of world.buildings) poly({ x0: b.footprint.x, y0: b.footprint.y, x1: b.footprint.x + b.footprint.w, y1: b.footprint.y + b.footprint.d }, 0xffe14d, 0, 2);
  poly({ x0: PLAYABLE.x0, y0: PLAYABLE.y0, x1: PLAYABLE.x1, y1: PLAYABLE.y1 }, 0x4dd8ff, 0, 2);
  for (const b of world.buildings) { const d = iso.toScreen(b.door.x, b.door.y); g.fillStyle(0xffffff, 1); g.fillCircle(d.x, d.y, 5); }
  return g;
}
