import assert from 'node:assert/strict';
import { COLMADO_TABLES, SITES, STREETS, WORLD } from '../src/world/losRobles.js';

const margin = WORLD.margin;
const sites = SITES.map(site => ({ ...site, x: site.x + margin, y: site.y + margin }));
const failures = [];
const report = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
};
const inGrid = (x, y) => x >= 0 && x < WORLD.columns && y >= 0 && y < WORLD.rows;
const inMapMargin = (x, y) => inGrid(x, y) && x >= margin && y >= margin && x < WORLD.columns - margin && y < WORLD.rows - margin;

let sitesInside = true;
for (const site of sites) {
  if (site.x < margin || site.y < margin || site.x + site.width > WORLD.columns - margin || site.y + site.depth > WORLD.rows - margin) sitesInside = false;
}
report('parcelas dentro del terreno con margen', sitesInside, `${sites.length} parcelas, margen ${margin} tiles`);

let parcelOverlap = false;
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const a = sites[i], b = sites[j];
  if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.depth && b.y < a.y + a.depth) parcelOverlap = true;
}
report('parcelas sin solapamientos', !parcelOverlap);

const roads = new Set();
for (const street of STREETS) {
  for (let n = street.from; n < street.to; n++) for (let lane = 0; lane < street.width; lane++) {
    const x = street.kind === 'horizontal' ? n : street.start + lane;
    const y = street.kind === 'horizontal' ? street.start + lane : n;
    roads.add(`${x},${y}`);
  }
}
let roadsInside = true;
for (const cell of roads) {
  const [x, y] = cell.split(',').map(Number);
  if (!inMapMargin(x, y)) roadsInside = false;
}
report('calles contenidas, sin alcanzar el perímetro', roadsInside, `${roads.size} celdas viales`);

const overlap = [];
for (const site of sites) for (let x = site.x; x < site.x + site.width; x++) for (let y = site.y; y < site.y + site.depth; y++) {
  if (roads.has(`${x},${y}`)) overlap.push(`${site.id}@${x},${y}`);
}
report('calles sin atravesar parcelas', overlap.length === 0, overlap.length ? overlap.join(' ') : '0 celdas compartidas');

const doorChecks = sites.every(site => {
  const [x, y] = site.door.map(value => value + margin);
  if (x < site.x || x >= site.x + site.width || y < site.y || y >= site.y + site.depth) return false;
  const nearestRoad = Math.min(...[...roads].map(cell => {
    const [rx, ry] = cell.split(',').map(Number);
    return Math.abs(rx - x) + Math.abs(ry - y);
  }));
  return nearestRoad <= (site.id === 'colmado' ? 4 : 3);
});
report('entradas dentro de la parcela y conectadas a la acera', doorChecks);

const roadCells = [...roads].map(cell => cell.split(',').map(Number));
const visited = new Set();
const queue = [roadCells[0]];
while (queue.length) {
  const [x, y] = queue.pop(), key = `${x},${y}`;
  if (visited.has(key)) continue;
  visited.add(key);
  for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const next = `${x + dx},${y + dy}`;
    if (roads.has(next) && !visited.has(next)) queue.push([x + dx, y + dy]);
  }
}
report('red vial conectada', visited.size === roads.size, `${visited.size}/${roads.size} celdas conectadas`);

const colmado = sites.find(site => site.id === 'colmado');
const tableCells = COLMADO_TABLES.map(table => [table.x + margin, table.y + margin]);
const tableChecks = tableCells.every(([x, y]) => x >= colmado.x && x < colmado.x + colmado.width && y >= colmado.y && y < colmado.y + colmado.depth && !roads.has(`${x},${y}`));
const door = colmado.door.map(value => value + margin);
report('mesas del colmado dentro de su parcela', tableChecks, `${tableCells.map(([x,y]) => `${x},${y}`).join(' y ')}`);
report('entrada del colmado libre entre las mesas', tableCells.every(([x,y]) => Math.abs(x - door[0]) > 1 || Math.abs(y - door[1]) > 1));

const park = sites.find(site => site.type === 'park');
const parkRoadOverlap = [...roads].some(cell => {
  const [x, y] = cell.split(',').map(Number);
  return x >= park.x && x < park.x + park.width && y >= park.y && y < park.y + park.depth;
});
report('parque delimitado y separado de las calles', !parkRoadOverlap && park.x >= margin && park.y >= margin && park.x + park.width <= WORLD.columns - margin && park.y + park.depth <= WORLD.rows - margin);

const vehicles = [[9,16],[51,16],[44,34],[15,46]].map(([x,y]) => [x + margin, y + margin]);
report('vehículos anclados en celdas de asfalto', vehicles.every(([x,y]) => roads.has(`${x},${y}`)));

assert.equal(failures.length, 0, `Auditoría fallida: ${failures.join(', ')}`);
