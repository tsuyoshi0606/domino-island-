// Structural audit of Barrio Los Robles. Pure Node (no Phaser, no browser): it loads the same world
// model the game uses and checks geometry, connectivity, collision and depth order.
//   npm run audit:world
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { BUILDINGS, PARK, PLAYABLE, ROADS, SPAWN, WORLD } from '../src/world/losRobles.js';
import { GENERATED_SPRITES } from '../src/world/generatedSprites.js';
import { createWorld } from '../src/world/world.js';
import { KIND, KIND_NAME, inPlayable, rectContains } from '../src/world/terrain.js';
import { PLAYER_RADIUS, blockedAt, inRect, moveInTiles } from '../src/world/collision.js';

const world = createWorld();
const { terrain, colliders, sorter } = world;
const failures = [];
const report = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
};
const rectOf = r => ({ x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.d });
const overlaps = (a, b, eps = 1e-6) => a.x0 < b.x1 - eps && b.x0 < a.x1 - eps && a.y0 < b.y1 - eps && b.y0 < a.y1 - eps;
const inside = (inner, outer, eps = 1e-6) => inner.x0 >= outer.x0 - eps && inner.y0 >= outer.y0 - eps && inner.x1 <= outer.x1 + eps && inner.y1 <= outer.y1 + eps;
const cellsOf = (kind) => { const out = []; for (let y = 0; y < WORLD.rows; y++) for (let x = 0; x < WORLD.columns; x++) if (terrain.at(x, y) === kind) out.push([x, y]); return out; };

// ---- 1. parcels --------------------------------------------------------------------------------------------------
const plots = [...BUILDINGS.map(b => ({ id: b.id, ...rectOf(b.plot) })), { id: 'park', ...rectOf(PARK.rect) }];
const play = { x0: PLAYABLE.x0, y0: PLAYABLE.y0, x1: PLAYABLE.x1, y1: PLAYABLE.y1 };
report('parcelas dentro del área jugable', plots.every(p => inside(p, play)), `${plots.length} parcelas, margen ${WORLD.margin} tiles`);
const plotOverlaps = [];
for (let i = 0; i < plots.length; i++) for (let j = i + 1; j < plots.length; j++) if (overlaps(plots[i], plots[j])) plotOverlaps.push(`${plots[i].id}×${plots[j].id}`);
report('parcelas sin solapamientos', plotOverlaps.length === 0, plotOverlaps.join(' '));

// ---- 2. buildings sit inside their own plot, on solid ground, clear of the streets --------------------------------------
const fpOutside = BUILDINGS.filter(b => !inside(rectOf(b.footprint), rectOf(b.plot), 0.8)).map(b => b.id);
report('cada edificio apoyado en su propia parcela (huella dentro de la parcela)', fpOutside.length === 0, fpOutside.join(' '));
const solidOutside = BUILDINGS.filter(b => !world.colliders.filter(c => c.id.startsWith(`${b.id}:`)).every(c => inside(c, rectOf(b.plot), 0.8))).map(b => b.id);
report('muros/colisión de cada edificio dentro de su parcela', solidOutside.length === 0, solidOutside.join(' '));
const onStreet = [];
for (const c of colliders) for (let y = Math.floor(c.y0 + 1e-6); y < Math.ceil(c.y1 - 1e-6); y++) for (let x = Math.floor(c.x0 + 1e-6); x < Math.ceil(c.x1 - 1e-6); x++) {
  if (c.kind === 'building' || c.kind === 'fence') { const k = terrain.at(x, y); if (k === KIND.ROAD || k === KIND.SIDEWALK) onStreet.push(`${c.id}@${x},${y}`); }
}
report('ningún edificio ni muro ocupa calzada o acera', onStreet.length === 0, onStreet.slice(0, 4).join(' '));

// ---- 3. streets --------------------------------------------------------------------------------------------------
const roadCells = cellsOf(KIND.ROAD), sidewalkCells = cellsOf(KIND.SIDEWALK);
report('calles dentro del área jugable', roadCells.every(([x, y]) => inPlayable(x, y)), `${roadCells.length} celdas viales`);
const component = (cells) => {
  const set = new Set(cells.map(c => c.join(',')));
  const seen = new Set(), stack = [cells[0]];
  while (stack.length) {
    const [x, y] = stack.pop(), k = `${x},${y}`;
    if (seen.has(k)) continue; seen.add(k);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && set.has(`${x + dx},${y + dy}`) && !seen.has(`${x + dx},${y + dy}`)) stack.push([x + dx, y + dy]);
  }
  return [seen.size, set.size];
};
const [roadSeen, roadTotal] = component(roadCells);
report('red vial conectada', roadSeen === roadTotal, `${roadSeen}/${roadTotal} celdas`);
const crossingCells = world.markings.crosswalks.map(c => [c.x, c.y]);
const [swSeen, swTotal] = component([...sidewalkCells, ...crossingCells]);
report('aceras continuas: una sola red conectada por los pasos de peatones', swSeen === swTotal, `${swSeen}/${swTotal} celdas`);
const swNextToRoad = sidewalkCells.every(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => terrain.at(x + dx, y + dy) === KIND.ROAD));
const roadNeedsSidewalk = roadCells.every(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => { const k = terrain.at(x + dx, y + dy); return k === KIND.ROAD || k === KIND.SIDEWALK || !inPlayable(x + dx, y + dy); }));
report('toda calzada está bordeada por acera (o por otra calzada)', roadNeedsSidewalk && swNextToRoad);
const cwOnRoad = world.markings.crosswalks.every(c => terrain.at(c.x, c.y) === KIND.ROAD);
report('pasos de peatones sobre calzada', cwOnRoad, `${world.markings.crosswalks.length} celdas, ${world.markings.junctions.length} cruces`);
const dashesInJunction = world.markings.centerLines.some(l => { for (let n = l.from; n < l.to; n++) { const cx = l.axis === 'x' ? n : Math.floor(l.at), cy = l.axis === 'x' ? Math.floor(l.at) : n; if (world.markings.junctions.some(j => rectContains(j, cx, cy))) return true; } return false; });
report('línea amarilla central interrumpida en cada cruce', !dashesInJunction, `${world.markings.centerLines.length} tramos`);

// ---- 4. doors, zones, props -----------------------------------------------------------------------------------------
const doorProblems = [];
for (const b of BUILDINGS) {
  const zone = rectOf(b.access);
  const cx = (zone.x0 + zone.x1) / 2, cy = (zone.y0 + zone.y1) / 2;
  if (!BUILDINGS.every(o => o.id === b.id || !overlaps(zone, rectOf(o.footprint)))) doorProblems.push(`${b.id}: zona de acceso invade otro edificio`);
  const free = [];
  for (let x = zone.x0; x <= zone.x1; x += 0.25) for (let y = zone.y0; y <= zone.y1; y += 0.25) if (!blockedAt(colliders, x, y)) free.push([x, y]);
  if (!free.length) doorProblems.push(`${b.id}: zona de acceso inalcanzable`);
}
report('cada entrada tiene una zona de acceso libre', doorProblems.length === 0, doorProblems.join('; '));

// Reachability over a 0.25-tile grid with the real player radius.
const STEP = 0.25, W = Math.round((PLAYABLE.x1 - PLAYABLE.x0) / STEP), H = Math.round((PLAYABLE.y1 - PLAYABLE.y0) / STEP);
const free = new Uint8Array(W * H);
for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) free[j * W + i] = blockedAt(colliders, PLAYABLE.x0 + (i + 0.5) * STEP, PLAYABLE.y0 + (j + 0.5) * STEP) ? 0 : 1;
const reach = new Uint8Array(W * H);
const idx = (x, y) => Math.floor((y - PLAYABLE.y0) / STEP) * W + Math.floor((x - PLAYABLE.x0) / STEP);
const start = idx(SPAWN.x, SPAWN.y);
const queue = [start]; reach[start] = 1;
while (queue.length) {
  const n = queue.pop(), i = n % W, j = (n - i) / W;
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ni = i + di, nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
    const m = nj * W + ni;
    if (free[m] && !reach[m]) { reach[m] = 1; queue.push(m); }
  }
}
const reachable = (x, y) => reach[idx(x, y)] === 1;
report('spawn en terreno libre', free[start] === 1);
const zoneUnreachable = BUILDINGS.filter(b => { const z = rectOf(b.access); for (let x = z.x0; x <= z.x1; x += 0.25) for (let y = z.y0; y <= z.y1; y += 0.25) if (reachable(x, y)) return false; return true; }).map(b => b.id);
report('todas las entradas alcanzables caminando desde el spawn', zoneUnreachable.length === 0, zoneUnreachable.join(' '));
const swUnreachable = sidewalkCells.filter(([x, y]) => { for (let a = 0; a < 4; a++) for (let c = 0; c < 4; c++) if (reachable(x + (a + 0.5) * STEP, y + (c + 0.5) * STEP)) return false; return true; });
report('todas las aceras transitables', swUnreachable.length === 0, `${sidewalkCells.length - swUnreachable.length}/${sidewalkCells.length}`);
const sidewalkWithin = (b, maxDist) => { // flood from the access zone, bounded, until a sidewalk cell is touched
  const z = rectOf(b.access), seen = new Set(), stack = [];
  for (let x = z.x0; x <= z.x1; x += STEP) for (let y = z.y0; y <= z.y1; y += STEP) if (!blockedAt(colliders, x, y)) { stack.push([x, y]); seen.add(`${x},${y}`); }
  const origin = stack[0];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (terrain.kindAt(x, y) === KIND.SIDEWALK) return true;
    for (const [dx, dy] of [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (seen.has(k) || Math.hypot(nx - origin[0], ny - origin[1]) > maxDist || blockedAt(colliders, nx, ny)) continue;
      seen.add(k); stack.push([nx, ny]);
    }
  }
  return false;
};
const doorToStreet = BUILDINGS.filter(b => !sidewalkWithin(b, 9)).map(b => b.id);
report('cada puerta conecta con una acera por suelo libre', doorToStreet.length === 0, doorToStreet.join(' '));

const surfaceBad = [], overlapBad = [];
for (const p of world.props) {
  const k = KIND_NAME[terrain.kindAt(p.x, p.y)];
  if (!inPlayable(Math.floor(p.x), Math.floor(p.y))) surfaceBad.push(`${p.id} fuera`);
  else if (!p.spec.on.includes(k)) surfaceBad.push(`${p.type}@${p.x},${p.y} sobre ${k}`);
}
for (const p of world.props.filter(p => p.solid)) {
  for (const b of BUILDINGS) if (world.colliders.filter(c => c.id.startsWith(`${b.id}:`)).some(c => c.poly ? false : overlaps(p.solid, c))) overlapBad.push(`${p.type}@${p.x},${p.y} dentro de ${b.id}`);
  for (const q of world.props) if (q.solid && q.id > p.id && overlaps(p.solid, q.solid, 0.05)) overlapBad.push(`${p.type}×${q.type}@${p.x},${p.y}`);
  for (const f of world.fences) if (overlaps(p.solid, f)) overlapBad.push(`${p.type}@${p.x},${p.y} en valla`);
}
report('decoración sobre superficies válidas (sin flotar sobre calzada/acera incorrecta)', surfaceBad.length === 0, surfaceBad.slice(0, 5).join('; '));
report('decoración sin solapes con edificios, vallas ni entre sí', overlapBad.length === 0, overlapBad.slice(0, 5).join('; '));

const cars = world.props.filter(p => p.type.startsWith('car-'));
const carBad = cars.filter(c => {
  for (const [x, y] of [[c.solid.x0, c.solid.y0], [c.solid.x1, c.solid.y0], [c.solid.x0, c.solid.y1], [c.solid.x1, c.solid.y1]]) if (terrain.kindAt(x, y) !== KIND.ROAD) return true;
  const axis = c.type.split('-')[2]; const w = c.solid.x1 - c.solid.x0, d = c.solid.y1 - c.solid.y0;
  return axis === 'x' ? w < d : d < w; // length must run along the lane axis
}).map(c => `${c.type}@${c.x},${c.y}`);
report('vehículos dentro de la calzada y alineados con su carril', carBad.length === 0, `${cars.length} vehículos ${carBad.join(' ')}`);
const carOnCrossing = cars.filter(c => world.markings.crosswalks.some(w => overlaps(c.solid, { x0: w.x, y0: w.y, x1: w.x + 1, y1: w.y + 1 }, 0.05))).map(c => c.id);
report('ningún vehículo bloquea un paso de peatones ni un cruce', carOnCrossing.length === 0 && cars.every(c => !world.markings.junctions.some(j => overlaps(c.solid, rectOf(j), 0.05))));
const tablesFree = world.props.filter(p => p.type.startsWith('domino-table'));
report('mesas de dominó en zonas sociales (parque o plaza del colmado)', tablesFree.every(t => rectContains(PARK.rect, t.x, t.y) || rectContains(BUILDINGS.find(b => b.id === 'colmado').plot, t.x, t.y)), `${tablesFree.length} mesas`);
const benchesInPark = world.props.filter(p => p.type.startsWith('bench'));
report('bancos dentro del parque', benchesInPark.every(b => rectContains(PARK.rect, b.x, b.y)), `${benchesInPark.length} bancos`);

// ---- 5. collision: nobody can walk through a building ------------------------------------------------------------------
const walkInto = (from, to) => { // push the player toward `to` in small steps; report the closest it gets inside
  let tx = from[0], ty = from[1];
  const n = 400, dx = (to[0] - from[0]) / n, dy = (to[1] - from[1]) / n;
  for (let i = 0; i < n; i++) { const r = moveInTiles(colliders, tx, ty, dx, dy); tx = r.tx; ty = r.ty; }
  return [tx, ty];
};
const insideShape = (c, x, y) => c.poly ? (() => { let ins = false; for (let i = 0, j = c.poly.length - 1; i < c.poly.length; j = i++) { const [ax, ay] = c.poly[i], [bx, by] = c.poly[j]; if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) ins = !ins; } return ins; })() : x > c.x0 && x < c.x1 && y > c.y0 && y < c.y1;
const breaches = [];
for (const b of BUILDINGS) {
  const cs = colliders.filter(c => c.id.startsWith(`${b.id}:`));
  const cx = b.footprint.x + b.footprint.w / 2, cy = b.footprint.y + b.footprint.d / 2;
  // From 24 directions, start outside the building and push toward its centre.
  for (let a = 0; a < 24; a++) {
    const ang = a / 24 * Math.PI * 2, R = Math.max(b.footprint.w, b.footprint.d) / 2 + 3;
    const from = [cx + Math.cos(ang) * R, cy + Math.sin(ang) * R];
    if (blockedAt(colliders, ...from)) continue;
    const end = walkInto(from, [cx, cy]);
    if (cs.some(c => insideShape(c, ...end))) breaches.push(`${b.id}@${(ang * 180 / Math.PI).toFixed(0)}°`);
  }
}
report('el personaje no puede atravesar ningún edificio (24 direcciones cada uno)', breaches.length === 0, breaches.slice(0, 5).join(' '));

const colmado = world.buildings.find(b => b.id === 'colmado');
const doorLine = [];
for (let t = -3; t <= 3; t += 0.1) { // sweep the whole facade line of the corner shop, approaching from the front terrace
  const px = colmado.door.x + t, py = colmado.door.y - t;       // along the chamfer (x + y = const)
  const end = walkInto([px + 2.2, py + 2.2], [px - 1.5, py - 1.5]);
  const solid = colliders.filter(c => c.id.startsWith('colmado:'));
  if (solid.some(c => insideShape(c, ...end))) doorLine.push(t.toFixed(1));
}
report('nadie puede colarse bajo la entrada del Colmado (barrido de toda la fachada)', doorLine.length === 0, doorLine.join(' '));
const enterColmado = world.interactions.find(i => i.id === 'colmado');
report('zona de interacción del Colmado accesible desde la plaza', enterColmado && reachable((enterColmado.rect.x0 + enterColmado.rect.x1) / 2, (enterColmado.rect.y0 + enterColmado.rect.y1) / 2) && inRect(enterColmado.rect, colmado.door.x + 0.8, colmado.door.y + 0.8));
const sealed = colliders.filter(c => c.kind === 'fence');
const gates = BUILDINGS.filter(b => b.fence).filter(b => { const z = rectOf(b.access); for (let x = z.x0; x <= z.x1; x += 0.25) for (let y = z.y0; y <= z.y1; y += 0.25) if (reachable(x, y)) return false; return true; }).map(b => b.id);
report('las vallas dejan paso por la puerta del jardín', gates.length === 0 && sealed.length > 0, `${sealed.length} tramos de valla`);

// ---- 6. depth order ----------------------------------------------------------------------------------------------------
const depthProblems = [];
for (const b of world.buildings) {
  const bb = b.solidBounds, mid = (bb.x0 + bb.x1) / 2;
  const behindD = sorter.actorDepth(mid, bb.y0 - 0.6), frontD = sorter.actorDepth(mid, Math.max(bb.y1 + 0.6, b.frontSum ? b.frontSum - mid + 0.8 : 0));
  const own = sorter.depthOf(b.id);
  if (!(behindD < own)) depthProblems.push(`${b.id}: personaje detrás no queda oculto`);
  if (!(frontD > own)) depthProblems.push(`${b.id}: personaje delante queda tapado`);
}
report('profundidad: el personaje se oculta tras los edificios y los cubre por delante', depthProblems.length === 0, depthProblems.join('; '));
const treeP = world.props.find(p => p.type === 'mango');
report('profundidad: el árbol del parque tapa al personaje que pasa detrás y no al que pasa delante', sorter.actorDepth(treeP.x, treeP.y - 1.2) < sorter.depthOf(treeP.id) && sorter.actorDepth(treeP.x, treeP.y + 1.2) > sorter.depthOf(treeP.id));
const ranks = world.buildings.map(b => sorter.rank(b.id));
report('profundidad derivada de coordenadas (rangos únicos, sin valores manuales)', new Set([...ranks, ...world.props.filter(p => p.solid).map(p => sorter.rank(p.id))]).size === ranks.length + world.props.filter(p => p.solid).length);

// ---- 7. assets -----------------------------------------------------------------------------------------------------------
const assetDir = path.resolve('public/assets/prototype');
const needed = [...new Set(BUILDINGS.filter(b => b.art.kind === 'png').map(b => `${b.art.key.replace('-pixel', '')}`))];
const pngFiles = { 'colmado': 'colmado-pixel.png', 'camila-house': 'camila-house-pixel.png', 'fashion': 'fashion-pixel.png', 'supermarket': 'supermarket-pixel.png', 'bus-station': 'bus-station-pixel.png', 'mango-tree': 'mango-tree-pixel.png' };
const missing = [...needed, 'mango-tree'].map(k => pngFiles[k]).filter(f => !f || !existsSync(path.join(assetDir, f)));
const genMissing = Object.values(GENERATED_SPRITES).filter(g => !existsSync(path.join(assetDir, g.file)));
const artKeys = BUILDINGS.filter(b => b.art.kind === 'generated').filter(b => !GENERATED_SPRITES[b.art.key]);
report('todos los recursos gráficos existen', !missing.length && !genMissing.length && !artKeys.length && existsSync(path.join(assetDir, 'palm.svg')) && existsSync(path.join(assetDir, 'protagonist-sheet.png')), `${Object.keys(GENERATED_SPRITES).length} sprites generados + 6 PNG`);
const kinds = new Set(BUILDINGS.filter(b => b.type === 'house').map(b => b.art.key));
report('cada vivienda usa un diseño arquitectónico distinto', kinds.size === BUILDINGS.filter(b => b.type === 'house').length, [...kinds].join(', '));
report('el colmado no está entre los edificios más pequeños y mantiene posición central', (() => { const c = colmado.center; return Math.abs(c.x - (PLAYABLE.x0 + PLAYABLE.x1) / 2) < 6; })());

assert.equal(failures.length, 0, `Auditoría fallida: ${failures.join(' | ')}`);
console.log(`\n${failures.length === 0 ? 'OK' : 'FALLÓ'}: todas las comprobaciones del mapa pasaron.`);
