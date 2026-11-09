// Minimal 2:1 isometric SVG toolkit. Units: x/y in tiles (64x32 px tile), z in px.
// Screen projection matches src/systems/IsometricSystem.js: sx=(x-y)*32, sy=(x+y)*16-z.
export const TILE_W = 64, TILE_H = 32;

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

export class IsoSvg {
  constructor() { this.items = []; this.min = [1e9, 1e9]; this.max = [-1e9, -1e9]; }
  P(x, y, z = 0) { return [(x - y) * TILE_W / 2, (x + y) * TILE_H / 2 - z]; }
  track(pts, pad = 2) {
    for (const [px, py] of pts) {
      this.min[0] = Math.min(this.min[0], px - pad); this.min[1] = Math.min(this.min[1], py - pad);
      this.max[0] = Math.max(this.max[0], px + pad); this.max[1] = Math.max(this.max[1], py + pad);
    }
  }
  poly(pts3, fill, { stroke = null, sw = 1, opacity = 1 } = {}) {
    const pts = pts3.map(p => this.P(...p)); this.track(pts, stroke ? sw : 0.5);
    const s = stroke ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"` : '';
    this.items.push(`<polygon points="${pts.map(p => p.map(v => +v.toFixed(2)).join(',')).join(' ')}" fill="${fill}"${s}${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`);
  }
  line(a3, b3, stroke, sw = 1, opacity = 1) {
    const a = this.P(...a3), b = this.P(...b3); this.track([a, b], sw);
    this.items.push(`<line x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}" x2="${b[0].toFixed(2)}" y2="${b[1].toFixed(2)}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="square"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`);
  }
  // Screen-space ellipse anchored to a 3D point (cx,cy,cz) with pixel radii.
  ellipse(c3, rx, ry, fill, { stroke = null, sw = 1, opacity = 1 } = {}) {
    const [px, py] = this.P(...c3); this.track([[px - rx, py - ry], [px + rx, py + ry]], sw);
    const s = stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : '';
    this.items.push(`<ellipse cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" rx="${rx}" ry="${ry}" fill="${fill}"${s}${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`);
  }
  rect(c3, w, h, fill, { stroke = null, sw = 1 } = {}) { // screen-space rect centred horizontally at point
    const [px, py] = this.P(...c3); this.track([[px - w / 2, py], [px + w / 2, py + h]], sw);
    const s = stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : '';
    this.items.push(`<rect x="${(px - w / 2).toFixed(2)}" y="${py.toFixed(2)}" width="${w}" height="${h}" fill="${fill}"${s}/>`);
  }
  // Axis-aligned box. Draws +y face (screen lower-left), +x face (lower-right) and top.
  box(x0, y0, x1, y1, z0, z1, { left, right, top, stroke = null, sw = 1 }) {
    const o = { stroke, sw };
    this.poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], left, o);
    this.poly([[x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1]], right, o);
    this.poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], top, o);
  }
  // Quads lying on the two visible vertical planes. faceY: plane y=c, u runs along x. faceX: plane x=c, u runs along y.
  quadY(c, u0, u1, z0, z1, fill, o = {}) { this.poly([[u0, c, z0], [u1, c, z0], [u1, c, z1], [u0, c, z1]], fill, o); }
  quadX(c, u0, u1, z0, z1, fill, o = {}) { this.poly([[c, u0, z0], [c, u1, z0], [c, u1, z1], [c, u0, z1]], fill, o); }
  ground(x0, y0, x1, y1, fill, o = {}) { this.poly([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], fill, o); }
  // Vertical cylinder (water tank, bin) with pixel radius r.
  cylinder(cx, cy, z0, z1, r, { side, top, stroke = '#171e23' }) {
    this.ellipse([cx, cy, z0], r, r / 2, shade(side, -0.25), { stroke, sw: 1.5 });
    const [px, py0] = this.P(cx, cy, z0), [, py1] = this.P(cx, cy, z1);
    this.track([[px - r, py1], [px + r, py0]], 1.5);
    this.items.push(`<rect x="${(px - r).toFixed(2)}" y="${py1.toFixed(2)}" width="${2 * r}" height="${(py0 - py1).toFixed(2)}" fill="${side}" stroke="${stroke}" stroke-width="1.5"/>`);
    this.ellipse([cx, cy, z1], r, r / 2, top, { stroke, sw: 1.5 });
  }
  /** originTile: the tile point whose screen position becomes the sprite origin (ground contact centre). */
  finish(originTile) {
    const minX = Math.floor(this.min[0]), minY = Math.floor(this.min[1]);
    const width = Math.ceil(this.max[0]) - minX, height = Math.ceil(this.max[1]) - minY;
    const [ox, oy] = this.P(...originTile);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" shape-rendering="crispEdges">\n  ${this.items.join('\n  ')}\n</svg>\n`;
    return { svg, width, height, originX: +((ox - minX) / width).toFixed(5), originY: +((oy - minY) / height).toFixed(5) };
  }
}
