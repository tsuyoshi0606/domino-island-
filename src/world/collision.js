import { PLAYABLE } from './losRobles.js';

// Collision lives in tile space, so it respects the isometric projection by construction:
// walls are axis-aligned rects in (x,y) tiles and the player's feet are a circle of
// radius `r` tiles, which projects to the 2:1 ellipse you see on screen.

export const PLAYER_RADIUS = 0.3;

/** Blocking shape from data: an axis-aligned rect {x,y,w,d} or a convex polygon {poly:[[x,y],...]} (e.g. a chamfered corner). */
export function rectFrom(shape, id = '', kind = 'solid') {
  if (shape.poly) {
    const xs = shape.poly.map(p => p[0]), ys = shape.poly.map(p => p[1]);
    return { id, kind, poly: shape.poly, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }
  const { x, y, w, d } = shape;
  return { id, kind, x0: x, y0: y, x1: x + w, y1: y + d };
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function distanceToPoly(poly, tx, ty) {
  let inside = false, best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[j];
    if ((ay > ty) !== (by > ty) && tx < (bx - ax) * (ty - ay) / (by - ay) + ax) inside = !inside;
    best = Math.min(best, distToSegment(tx, ty, ax, ay, bx, by));
  }
  return inside ? 0 : best;
}

/** Distance from point to rect (0 when inside). */
function distanceToRect(r, tx, ty) {
  if (r.poly) return distanceToPoly(r.poly, tx, ty);
  const dx = Math.max(r.x0 - tx, 0, tx - r.x1), dy = Math.max(r.y0 - ty, 0, ty - r.y1);
  return Math.hypot(dx, dy);
}

export function blockedAt(colliders, tx, ty, r = PLAYER_RADIUS) {
  if (tx - r < PLAYABLE.x0 || ty - r < PLAYABLE.y0 || tx + r > PLAYABLE.x1 || ty + r > PLAYABLE.y1) return true;
  for (const c of colliders) if (distanceToRect(c, tx, ty) < r) return true;
  return false;
}

/** The first collider overlapping the point, for diagnostics. */
export function colliderAt(colliders, tx, ty, r = PLAYER_RADIUS) {
  return colliders.find(c => distanceToRect(c, tx, ty) < r) ?? null;
}

/** Move in tile space; if blocked, slide along whichever tile axis is free (walls are tile-axis aligned). */
export function moveInTiles(colliders, tx, ty, dtx, dty, r = PLAYER_RADIUS) {
  if (!blockedAt(colliders, tx + dtx, ty + dty, r)) return { tx: tx + dtx, ty: ty + dty, moved: true };
  const canX = dtx !== 0 && !blockedAt(colliders, tx + dtx, ty, r);
  const canY = dty !== 0 && !blockedAt(colliders, tx, ty + dty, r);
  if (canX && canY) return Math.abs(dtx) >= Math.abs(dty) ? { tx: tx + dtx, ty, moved: true } : { tx, ty: ty + dty, moved: true };
  if (canX) return { tx: tx + dtx, ty, moved: true };
  if (canY) return { tx, ty: ty + dty, moved: true };
  return { tx, ty, moved: false };
}

export const inRect = (r, tx, ty) => tx >= r.x0 && tx < r.x1 && ty >= r.y0 && ty < r.y1;
