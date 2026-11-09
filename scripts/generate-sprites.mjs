// Generates the isometric SVG sprites that used to be provisional placeholders
// (homes, cars, domino tables, benches, bins) directly on the 64x32 tile grid, so
// every footprint sits exactly on its tiles. Run: npm run generate:sprites
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { IsoSvg, shade } from './lib/iso-svg.mjs';

const OUT = path.resolve('public/assets/prototype/generated');
const MANIFEST = path.resolve('src/world/generatedSprites.js');
const manifest = {};
const INK = '#2a2420';

function shadow(s, x0, y0, x1, y1, len, alpha = 0.28) {
  // Sun from the north-west: shadows fall toward +x and slightly +y.
  s.poly([[x1, y0 + 0.1, 0], [x1 + len, y0 + 0.1 + len * 0.35, 0], [x1 + len, y1 + len * 0.35, 0], [x1, y1, 0]], '#12201a', { opacity: alpha });
  s.poly([[x0 + 0.1, y1, 0], [x1, y1, 0], [x1 + len, y1 + len * 0.35, 0], [x0 + 0.1 + len, y1 + len * 0.35, 0]], '#12201a', { opacity: alpha * 0.7 });
}

function tank(s, cx, cy, z) {
  for (const [dx, dy] of [[-0.12, -0.05], [0.12, -0.05], [0, 0.1]]) s.line([cx + dx, cy + dy, z], [cx + dx, cy + dy, z + 10], '#1b2328', 3);
  s.cylinder(cx, cy, z + 8, z + 36, 17, { side: '#2d363d', top: '#4a565d' });
}

function window3(s, face, c, u0, u1, z0, z1, glass = '#78c4d2', bars = true) {
  const quad = face === 'y' ? s.quadY.bind(s) : s.quadX.bind(s);
  quad(c, u0, u1, z0, z1, '#3b2c22');
  const du = (u1 - u0) * 0.14, dz = 3;
  quad(c, u0 + du, u1 - du, z0 + dz, z1 - dz, glass);
  if (bars) {
    const P = (u, z) => face === 'y' ? [u, c, z] : [c, u, z];
    for (let i = 1; i < 4; i++) { const u = u0 + (u1 - u0) * i / 4; s.line(P(u, z0 + dz), P(u, z1 - dz), '#1d2326', 2); }
    s.line(P(u0 + du, (z0 + z1) / 2), P(u1 - du, (z0 + z1) / 2), '#1d2326', 2);
  }
}

function door(s, u0, u1, y, h, color) {
  s.quadY(y, u0, u1, 0, h, shade(color, -0.35));
  s.quadY(y, u0 + 0.05, u1 - 0.05, 0, h - 5, color);
  s.line([u0 + 0.09, y, 6], [u0 + 0.09, y, h - 10], shade(color, 0.18), 2);
  s.line([u1 - 0.15, y, h * 0.48], [u1 - 0.15, y, h * 0.48 + 1], '#f1d47a', 3);
}

function railing(s, x0, y0, x1, y1, z, hgt = 26) {
  const pts = [];
  for (let u = x0; u <= x1 + 0.001; u += 0.5) pts.push([u, y1]);
  for (let v = y1 - 0.5; v >= y0 - 0.001; v -= 0.5) pts.push([x1, v]);
  for (const [px, py] of pts) s.line([px, py, z], [px, py, z + hgt], '#1d2326', 2);
  s.line([x0, y1, z + hgt], [x1, y1, z + hgt], '#1d2326', 2); s.line([x1, y1, z + hgt], [x1, y0, z + hgt], '#1d2326', 2);
}

function pot(s, x, y) { // small potted plant
  s.cylinder(x, y, 0, 12, 7, { side: '#b56c36', top: '#7a4a24', stroke: '#5a3a20' });
  s.ellipse([x, y, 20], 9, 7, '#2f8a47'); s.ellipse([x - 0.08, y, 24], 6, 5, '#46a85a');
}

function flatRoof(s, w, d, h, c) {
  s.box(-0.07, -0.07, w + 0.07, d + 0.07, h, h + 9, { left: c.trimL, right: c.trimR, top: c.top, stroke: INK, sw: 1.5 });
  for (let i = 1; i < 4; i++) s.line([w * i / 4, -0.02, h + 9], [w * i / 4, d + 0.02, h + 9], shade(c.top, -0.12), 1);
}

const HOMES = {
  // Casa del protagonista: beige concrete, roof terrace with railing, tinaco, barred windows.
  'home-protagonista': { w: 4.2, d: 3.8, h: 128, build(s) {
    const c = { wl: '#ecd3a0', wr: '#c9a56a', top: '#dccaa8', trimL: '#bfa070', trimR: '#8f7048' };
    shadow(s, 0, 0, 4.2, 3.8, 1.4);
    s.box(0, 0, 4.2, 3.8, 0, 128, { left: c.wl, right: c.wr, top: c.top, stroke: INK, sw: 2 });
    s.quadY(3.8, 0, 4.2, 0, 12, shade(c.wl, -0.22)); s.quadX(4.2, 0, 3.8, 0, 12, shade(c.wr, -0.22));
    flatRoof(s, 4.2, 3.8, 128, c);
    railing(s, 0.1, 0.1, 4.1, 3.7, 137, 24);
    tank(s, 3.3, 1.2, 137);
    window3(s, 'y', 3.8, 2.3, 3.5, 58, 100);
    window3(s, 'x', 4.2, 1.0, 2.5, 58, 100);
    door(s, 0.7, 1.45, 3.8, 108, '#7a4a2e');
    s.box(0.45, 3.8, 1.7, 4.2, 0, 8, { left: '#d8c6a2', right: '#b9a57e', top: '#e8d8b6', stroke: INK, sw: 1 });
    s.box(0.4, 3.8, 1.75, 4.55, 112, 119, { left: '#8f7048', right: '#6b5236', top: '#c9ac7a', stroke: INK, sw: 1.5 });
    pot(s, 2.0, 4.15); pot(s, 3.9, 4.1);
  }, origin: [2.1, 1.9] },
  // Casa residencial A: sandy yellow, side porch with posts, wide barred window, rooftop tinaco.
  'home-a': { w: 4.0, d: 3.4, h: 120, build(s) {
    const c = { wl: '#f2e0a4', wr: '#cdb577', top: '#c9937a', trimL: '#d9b07c', trimR: '#a98655' };
    shadow(s, 0, 0, 4.0, 3.4, 1.3);
    s.box(0, 0, 4.0, 3.4, 0, 120, { left: c.wl, right: c.wr, top: c.top, stroke: INK, sw: 2 });
    s.quadY(3.4, 0, 4.0, 0, 11, shade(c.wl, -0.2)); s.quadX(4.0, 0, 3.4, 0, 11, shade(c.wr, -0.2));
    flatRoof(s, 4.0, 3.4, 120, c);
    tank(s, 0.8, 0.8, 129);
    window3(s, 'y', 3.4, 0.5, 1.9, 52, 98);
    window3(s, 'x', 4.0, 0.9, 2.3, 52, 98);
    door(s, 2.75, 3.5, 3.4, 106, '#5f7a68');
    // roofed carport/porch to the right of the facade
    for (const [px, py] of [[2.4, 4.2], [3.9, 4.2]]) s.box(px - 0.05, py - 0.05, px + 0.05, py + 0.05, 0, 100, { left: '#7a6a58', right: '#5f5244', top: '#9a8a76', stroke: INK, sw: 1 });
    s.box(2.3, 3.4, 4.05, 4.3, 100, 108, { left: '#b69062', right: '#8d6e48', top: '#d8bd90', stroke: INK, sw: 1.5 });
    pot(s, 0.5, 3.8);
  }, origin: [2.0, 1.7] },
  // Casa residencial B: teal family house with blue zinc patio cover and plastic chairs.
  'home-b': { w: 4.2, d: 3.2, h: 118, build(s) {
    const c = { wl: '#93d3c9', wr: '#5fa7a6', top: '#6b7f88', trimL: '#e9e2cf', trimR: '#b9b3a2' };
    shadow(s, 0, 0, 4.2, 3.2, 1.3);
    s.box(0, 0, 4.2, 3.2, 0, 118, { left: c.wl, right: c.wr, top: c.top, stroke: INK, sw: 2 });
    s.quadY(3.2, 0, 4.2, 0, 11, '#e9e2cf'); s.quadX(4.2, 0, 3.2, 0, 11, '#b9b3a2');
    flatRoof(s, 4.2, 3.2, 118, c);
    tank(s, 3.4, 0.9, 127);
    window3(s, 'y', 3.2, 0.45, 1.6, 54, 98, '#a9dff0');
    window3(s, 'x', 4.2, 0.8, 2.2, 54, 98, '#a9dff0');
    door(s, 2.05, 2.8, 3.2, 106, '#c88a4a');
    // patio cover (blue zinc) on posts, sloping down away from the house
    for (const [px, py] of [[0.2, 4.5], [2.1, 4.5], [4.1, 4.5]]) s.box(px - 0.05, py - 0.05, px + 0.05, py + 0.05, 0, 76, { left: '#e9e2cf', right: '#b9b3a2', top: '#fff', stroke: INK, sw: 1 });
    s.poly([[0.1, 3.2, 100], [4.3, 3.2, 100], [4.3, 4.6, 80], [0.1, 4.6, 80]], '#3f78c2', { stroke: '#1f3f73', sw: 1.5 });
    for (let u = 0.6; u < 4.3; u += 0.6) s.line([u, 3.2, 100], [u, 4.6, 80], '#2d5ea0', 1);
    for (const [cx, cy] of [[0.9, 3.95], [1.55, 4.1]]) { // two white plastic chairs under the patio
      s.box(cx - 0.18, cy - 0.18, cx + 0.18, cy + 0.18, 14, 20, { left: '#f2efe6', right: '#d7d3c7', top: '#fff', stroke: '#9a968a', sw: 1 });
      s.box(cx - 0.18, cy - 0.2, cx + 0.18, cy - 0.14, 20, 44, { left: '#f2efe6', right: '#d7d3c7', top: '#fff', stroke: '#9a968a', sw: 1 });
      s.line([cx - 0.14, cy + 0.14, 0], [cx - 0.14, cy + 0.14, 14], '#9a968a', 2); s.line([cx + 0.14, cy + 0.14, 0], [cx + 0.14, cy + 0.14, 14], '#9a968a', 2);
    }
  }, origin: [2.1, 1.6] },
  // Casa residencial C: salmon/red popular house with a pitched corrugated zinc roof and blue shutters.
  'home-c': { w: 3.6, d: 3.4, h: 104, build(s) {
    shadow(s, 0, 0, 3.6, 3.4, 1.4);
    s.box(0, 0, 3.6, 3.4, 0, 104, { left: '#e88f7f', right: '#b95b52', top: '#b95b52', stroke: INK, sw: 2 });
    s.quadY(3.4, 0, 3.6, 0, 11, '#8e3f3a'); s.quadX(3.6, 0, 3.4, 0, 11, '#7a3430');
    // gable (ridge along x): visible east gable end plus the south slope
    const rh = 46;
    s.poly([[3.6, 0, 104], [3.6, 3.4, 104], [3.6, 1.7, 104 + rh]], '#cf766a', { stroke: INK, sw: 2 });
    s.poly([[-0.2, 3.65, 99], [3.8, 3.65, 99], [3.8, 1.7, 104 + rh], [-0.2, 1.7, 104 + rh]], '#9aa3a8', { stroke: INK, sw: 2 });
    for (let u = 0.1; u < 3.8; u += 0.4) s.line([u, 3.65, 99], [u, 1.7, 104 + rh], '#7c868c', 1.5);
    s.line([-0.2, 1.7, 104 + rh], [3.8, 1.7, 104 + rh], '#6e777c', 3);
    window3(s, 'y', 3.4, 2.15, 3.2, 50, 90, '#78c4d2', false);
    s.quadY(3.401, 1.95, 2.15, 50, 90, '#2f6bb5'); s.quadY(3.401, 3.2, 3.4, 50, 90, '#2f6bb5');
    window3(s, 'x', 3.6, 0.8, 1.9, 50, 90, '#78c4d2', false);
    door(s, 0.55, 1.3, 3.4, 98, '#3f6fb0');
    s.box(0.35, 3.4, 1.5, 3.8, 0, 7, { left: '#cfc7b4', right: '#a9a290', top: '#e3dcc8', stroke: INK, sw: 1 });
    for (const [cx, cy] of [[2.4, 4.1], [3.1, 4.2]]) { // red plastic chairs on the porch
      s.box(cx - 0.18, cy - 0.18, cx + 0.18, cy + 0.18, 14, 20, { left: '#d9433f', right: '#a92f2c', top: '#ee5b55', stroke: '#6b1c1a', sw: 1 });
      s.box(cx - 0.18, cy - 0.2, cx + 0.18, cy - 0.14, 20, 44, { left: '#d9433f', right: '#a92f2c', top: '#ee5b55', stroke: '#6b1c1a', sw: 1 });
      s.line([cx - 0.14, cy + 0.14, 0], [cx - 0.14, cy + 0.14, 14], '#6b1c1a', 2); s.line([cx + 0.14, cy + 0.14, 0], [cx + 0.14, cy + 0.14, 14], '#6b1c1a', 2);
    }
  }, origin: [1.8, 1.7] }
};

const CAR_COLORS = { red: '#c8372d', blue: '#2f6bb5', white: '#e6e6e0' };

function car(colorName, axis, end) {
  const s = new IsoSvg(), col = CAR_COLORS[colorName];
  const L = 3.0, W = 1.3;
  const M = (a, b) => axis === 'x' ? [a, b] : [b, a];
  const rect = (a0, a1, b0, b1) => { const p = M(a0, b0), q = M(a1, b1); return [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])]; };
  const side = (u0, u1, z0, z1, fill, o) => axis === 'x' ? s.quadY(W, u0, u1, z0, z1, fill, o) : s.quadX(W, u0, u1, z0, z1, fill, o);
  const endf = (b0, b1, z0, z1, fill, o) => axis === 'x' ? s.quadX(L, b0, b1, z0, z1, fill, o) : s.quadY(L, b0, b1, z0, z1, fill, o);
  const cs = { left: shade(col, 0), right: shade(col, -0.22), top: shade(col, 0.15) };
  const sh = rect(0, L, 0, W);
  shadow(s, sh[0], sh[1], sh[2], sh[3], 0.55, 0.3);
  const body = rect(0, L, 0, W); s.box(...body, 8, 40, { ...cs, stroke: INK, sw: 1.5 });
  const cab = rect(0.85, 2.15, 0.12, W - 0.12); s.box(...cab, 40, 68, { left: shade(col, 0.05), right: shade(col, -0.25), top: shade(col, 0.2), stroke: INK, sw: 1.5 });
  // side windows + end window
  side(1.0, 1.95, 44, 64, '#7fb8c8');
  const lit = end === 'front';
  endf(0.2, W - 0.2, 44, 64, lit ? '#6faac0' : '#5f8fa3');
  // lights on the visible end
  const lamp = lit ? '#ffe9a8' : '#d8302a';
  endf(0.08, 0.32, 22, 30, lamp, { stroke: INK, sw: 1 }); endf(W - 0.32, W - 0.08, 22, 30, lamp, { stroke: INK, sw: 1 });
  endf(0.45, W - 0.45, 12, 18, '#2b2d30');
  // wheels on the visible long side
  for (const a of [0.6, L - 0.6]) {
    const pts = Array.from({ length: 12 }, (_, k) => { const t = k / 12 * Math.PI * 2, u = a + Math.cos(t) * 0.26, z = 13 + Math.sin(t) * 12; return axis === 'x' ? [u, W, z] : [W, u, z]; });
    s.poly(pts, '#1b1d1f', { stroke: '#0c0d0e', sw: 1 });
    const hub = Array.from({ length: 8 }, (_, k) => { const t = k / 8 * Math.PI * 2, u = a + Math.cos(t) * 0.1, z = 13 + Math.sin(t) * 5; return axis === 'x' ? [u, W, z] : [W, u, z]; });
    s.poly(hub, '#9a9a96');
  }
  const o = axis === 'x' ? [L / 2, W / 2] : [W / 2, L / 2];
  return { s, origin: [o[0], o[1], 0] };
}

const CHAIR = { white: { l: '#f2efe6', r: '#d3cfc2', t: '#ffffff', st: '#8d897d' }, red: { l: '#d9433f', r: '#a92f2c', t: '#ee5b55', st: '#5a1715' } };
function chair(s, cx, cy, back, c) {
  // back: which side holds the backrest: 'n' (y-), 'w' (x-), 's' (y+), 'e' (x+)
  const h = 0.22;
  const legs = [[-h, -h], [h, -h], [-h, h], [h, h]];
  for (const [dx, dy] of legs) s.line([cx + dx * 0.8, cy + dy * 0.8, 0], [cx + dx * 0.8, cy + dy * 0.8, 24], c.st, 2);
  const bk = { n: [cx - h, cy - h - 0.06, cx + h, cy - h + 0.02], w: [cx - h - 0.06, cy - h, cx - h + 0.02, cy + h], s: [cx - h, cy + h - 0.02, cx + h, cy + h + 0.06], e: [cx + h - 0.02, cy - h, cx + h + 0.06, cy + h] }[back];
  const drawBack = () => s.box(...bk.slice(0, 2), ...bk.slice(2), 24, 54, { left: c.l, right: c.r, top: c.t, stroke: c.st, sw: 1 });
  if (back === 'n' || back === 'w') drawBack();
  s.box(cx - h, cy - h, cx + h, cy + h, 22, 28, { left: c.l, right: c.r, top: c.t, stroke: c.st, sw: 1 });
  if (back === 's' || back === 'e') drawBack();
}

function dominoTable(variant) {
  const s = new IsoSvg();
  const chairs = variant === 'white' ? CHAIR.white : CHAIR.red;
  const felt = variant === 'white' ? { l: '#565c63', r: '#3f444a', t: '#6a7178' } : { l: '#8e2b2a', r: '#6a1f1e', t: '#a53533' };
  shadow(s, -1.0, -1.0, 1.0, 1.0, 0.7, 0.26);
  chair(s, 0, -1.05, 's', chairs); chair(s, -1.05, 0, 'e', chairs);
  s.line([0, 0, 0], [0, 0, 40], '#3a2a20', 7);
  s.box(-0.62, -0.62, 0.62, 0.62, 38, 44, { left: felt.l, right: felt.r, top: felt.t, stroke: INK, sw: 1.5 });
  s.poly([[-0.48, -0.48, 44], [0.48, -0.48, 44], [0.48, 0.48, 44], [-0.48, 0.48, 44]], shade(felt.t, -0.12));
  for (const [x, y, ax] of [[-0.25, -0.2, 0], [0.12, -0.05, 1], [-0.05, 0.25, 0], [0.28, 0.28, 1]]) {
    const [w, d] = ax ? [0.07, 0.2] : [0.2, 0.07];
    s.poly([[x - w, y - d, 45], [x + w, y - d, 45], [x + w, y + d, 45], [x - w, y + d, 45]], '#f5e8cf', { stroke: '#33281f', sw: 0.8 });
  }
  chair(s, 1.05, 0, 'w', chairs); chair(s, 0, 1.05, 'n', chairs);
  return { s, origin: [0, 0, 0] };
}

function bench(back) {
  const s = new IsoSvg();
  const alongX = back === 'n' || back === 's';
  const [a, b] = alongX ? [2.0, 0.5] : [0.5, 2.0];
  const wood = { left: '#a8693a', right: '#7f4d27', top: '#c4854e' };
  shadow(s, 0, 0, a, b, 0.4, 0.26);
  for (const [lx, ly] of alongX ? [[0.2, 0.25], [a - 0.2, 0.25]] : [[0.25, 0.2], [0.25, b - 0.2]]) s.line([lx, ly, 0], [lx, ly, 18], '#2f2924', 4);
  const bk = { n: [0, 0, a, 0.1], s: [0, b - 0.1, a, b], w: [0, 0, 0.1, b], e: [a - 0.1, 0, a, b] }[back];
  const drawBack = () => s.box(bk[0], bk[1], bk[2], bk[3], 22, 46, { ...wood, stroke: INK, sw: 1.2 });
  if (back === 'n' || back === 'w') drawBack();
  s.box(0, 0, a, b, 17, 23, { ...wood, stroke: INK, sw: 1.2 });
  if (back === 's' || back === 'e') drawBack();
  return { s, origin: [a / 2, b / 2, 0] };
}

function bin() {
  const s = new IsoSvg();
  shadow(s, -0.2, -0.2, 0.2, 0.2, 0.3, 0.25);
  s.cylinder(0, 0, 0, 24, 9, { side: '#3f6b4a', top: '#58896a', stroke: '#1b2a20' });
  s.line([0, 0, 24], [0, 0, 30], '#1b2a20', 3);
  return { s, origin: [0, 0, 0] };
}

async function emit(key, built, footprint) {
  const { s, origin } = built;
  const out = s.finish(origin);
  await writeFile(path.join(OUT, `${key}.svg`), out.svg);
  manifest[key] = { file: `generated/${key}.svg`, width: out.width, height: out.height, originX: out.originX, originY: out.originY, footprint };
}

await mkdir(OUT, { recursive: true });
for (const [key, spec] of Object.entries(HOMES)) {
  const s = new IsoSvg(); spec.build(s);
  await emit(key, { s, origin: [...spec.origin, 0] }, { w: spec.w, d: spec.d });
}
for (const color of Object.keys(CAR_COLORS)) for (const axis of ['x', 'y']) for (const end of ['front', 'rear']) {
  await emit(`car-${color}-${axis}-${end}`, car(color, axis, end), axis === 'x' ? { w: 3.0, d: 1.3 } : { w: 1.3, d: 3.0 });
}
for (const v of ['white', 'red']) await emit(`domino-table-${v}`, dominoTable(v), { w: 2.4, d: 2.4 });
for (const b of ['n', 's', 'e', 'w']) await emit(`bench-${b}`, bench(b), b === 'n' || b === 's' ? { w: 2.0, d: 0.5 } : { w: 0.5, d: 2.0 });
await emit('bin', bin(), { w: 0.4, d: 0.4 });

const js = `// AUTO-GENERATED by scripts/generate-sprites.mjs — do not edit by hand.\n// width/height are the native SVG size in px; origin is the ground-contact point (normalised).\nexport const GENERATED_SPRITES = Object.freeze(${JSON.stringify(manifest, null, 2)});\n`;
await writeFile(MANIFEST, js);
console.log(`Generated ${Object.keys(manifest).length} sprites -> ${path.relative(process.cwd(), OUT)}`);
