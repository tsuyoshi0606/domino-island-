// Isometric depth ordering derived from world coordinates — no per-sprite magic depths.
//
// Every static object that can occlude something is registered as an axis-aligned footprint
// rect in tile space. Two rects are ordered with the classic isometric rule: A is behind B when A
// lies entirely on the far side of B along x or y. The resulting partial order is turned into a
// total rank once (topological sort); actors then slot between the ranks of the objects they
// stand in front of and behind, recomputed from their tile position.

const EPS = 1e-6;
export const DEPTH_BASE = 1000;
export const DEPTH_STEP = 4;

const behind = (a, b) => a.x1 <= b.x0 + EPS || a.y1 <= b.y0 + EPS;
const key = o => (o.x0 + o.x1) / 2 + (o.y0 + o.y1) / 2 + ((o.x1 - o.x0) + (o.y1 - o.y0)) / 4;

export class DepthSorter {
  /** @param {{id:string,x0:number,y0:number,x1:number,y1:number}[]} items */
  constructor(items) {
    this.items = items;
    this.rankById = new Map();
    const n = items.length;
    const out = Array.from({ length: n }, () => []);
    const indeg = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const ab = behind(items[i], items[j]), ba = behind(items[j], items[i]);
      if (ab && !ba) { out[i].push(j); indeg[j]++; }
    }
    const ready = [], done = new Array(n).fill(false);
    for (let i = 0; i < n; i++) if (!indeg[i]) ready.push(i);
    let rank = 0, placed = 0;
    while (placed < n) {
      if (!ready.length) { // cycle (overlapping footprints): release the nearest-to-back remaining item
        let best = -1;
        for (let i = 0; i < n; i++) if (!done[i] && (best < 0 || key(items[i]) < key(items[best]))) best = i;
        indeg[best] = 0; ready.push(best);
      }
      ready.sort((p, q) => key(items[p]) - key(items[q]) || (items[p].id < items[q].id ? -1 : 1));
      const i = ready.shift();
      if (done[i]) continue;
      done[i] = true; placed++;
      this.rankById.set(items[i].id, rank++);
      for (const j of out[i]) if (!done[j] && --indeg[j] === 0) ready.push(j);
    }
    this.count = rank;
  }

  rank(id) { return this.rankById.get(id) ?? -1; }
  /** Phaser depth of a registered static object. */
  depthOf(id) { return DEPTH_BASE + this.rank(id) * DEPTH_STEP; }
  /** Depth slightly above a registered object (labels, signs attached to it). */
  depthAbove(id, k = 1) { return this.depthOf(id) + k; }

  /** Phaser depth for something standing at tile position (tx,ty): above everything it is in front of. */
  actorDepth(tx, ty) {
    let lo = -1, hi = Infinity;
    for (const o of this.items) {
      const r = this.rankById.get(o.id);
      const inFront = tx >= o.x1 - EPS || ty >= o.y1 - EPS;
      const isBehind = tx <= o.x0 + EPS || ty <= o.y0 + EPS;
      if (inFront && isBehind) continue; // opposite sides along the two axes: far apart on screen, order is irrelevant
      if (inFront) { if (r > lo) lo = r; }
      else if (isBehind) { if (r < hi) hi = r; }
      else if (tx + ty >= (o.frontSum ?? (o.x0 + o.x1) / 2 + (o.y0 + o.y1) / 2)) { if (r > lo) lo = r; } // inside the bounding box: compare with the facade diagonal
      else if (r < hi) hi = r;
    }
    return DEPTH_BASE + (lo + 0.5) * DEPTH_STEP; // when the constraints conflict, the actor stays visible
  }
}
