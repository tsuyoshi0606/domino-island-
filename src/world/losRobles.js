// Barrio Los Robles — single source of truth for the district plan.
//
// ALL coordinates are final grid tiles (x grows down-right on screen, y grows down-left),
// i.e. there is no hidden "+margin" translation anywhere. Rects are half-open:
// [x, x + w) × [y, y + d). Streets, plots, footprints, solids and doors are data only;
// terrain, collision, depth and rendering are derived from them (see terrain.js,
// collision.js, depth.js and src/render/*).
//
// Plan (north at the top of the screen):
//
//   N band  y 4–14   Casa del protagonista · Casa de Camila · Casa residencial A · Estación de Guaguas
//   H1      y 15–19  (sidewalk 15, road 16–18, sidewalk 19)
//   M band  y 20–29  Moda Urbana · Parque Los Robles · Supermercado La Unión
//   H2      y 30–34
//   S band  y 35–46  Casa residencial C · Colmado Don Ramón (+ plaza) · Casa residencial B
//   H3      y 47–51
//
// Vertical streets V0 / V1 / V2 / V3 close the circuit. Every building fronts a street that
// lies to its south or east, which is the side the isometric sprites show.

export const WORLD = Object.freeze({ columns: 72, rows: 56, tileWidth: 64, tileHeight: 32, margin: 4 });

/** Walkable/buildable area; the outer margin is landscaped ground behind the boundary curb. */
export const PLAYABLE = Object.freeze({
  x0: WORLD.margin, y0: WORLD.margin,
  x1: WORLD.columns - WORLD.margin, y1: WORLD.rows - WORLD.margin
});

// Road lanes only. Sidewalks are derived: every non-road cell touching a road cell (8-neighbourhood).
export const ROADS = Object.freeze([
  { id: 'H1', label: 'Avenida Los Robles', axis: 'x', x: 5, y: 16, w: 62, d: 3 },
  { id: 'H2', label: 'Calle del Parque', axis: 'x', x: 5, y: 31, w: 62, d: 3 },
  { id: 'H3', label: 'Calle del Colmado', axis: 'x', x: 5, y: 48, w: 62, d: 3 },
  { id: 'V0', label: 'Calle Oeste', axis: 'y', x: 5, y: 16, w: 3, d: 35 },
  { id: 'V1', label: 'Calle Moda', axis: 'y', x: 21, y: 16, w: 3, d: 35 },
  { id: 'V2', label: 'Calle Unión', axis: 'y', x: 44, y: 16, w: 3, d: 35 },
  { id: 'V3', label: 'Calle Este', axis: 'y', x: 64, y: 16, w: 3, d: 35 }
]);

/** Public park: grass base + pavings + paths (see PARK). */
export const PARK = Object.freeze({
  id: 'park', name: 'Parque Los Robles', zone: 'park',
  rect: { x: 25, y: 20, w: 18, d: 10 },
  plaza: { x: 30, y: 22, w: 8, d: 6 },
  // Paths connect every street entrance to the plaza.
  paths: [
    { x: 33, y: 20, w: 2, d: 2 }, { x: 33, y: 28, w: 2, d: 2 },
    { x: 25, y: 24, w: 5, d: 2 }, { x: 38, y: 24, w: 5, d: 2 }
  ],
  // Paving pads under the two domino tables.
  pads: [{ x: 26, y: 21, w: 4, d: 3 }, { x: 38, y: 26, w: 4, d: 3 }],
  center: { x: 34, y: 25 }
});

/**
 * Buildings. `footprint` is the tile rect the art is mapped onto (the sprite's isometric
 * plate). `solid` is what blocks the player (walls); the rest of the footprint (terrace,
 * front yard) is walkable. `door` is the point on the facade; `access` is the interaction
 * zone in front of it. `path` is paving that links the door with the street sidewalk.
 * `art` describes how to draw it:
 *   - png sprites: `anchor` = ground-centre pixel of the platform inside the source image;
 *                  `scale` is chosen so (w + d) · 32 px == plate width · scale.
 *   - generated svg sprites (scripts/generate-sprites.mjs): placed by their own origin.
 */
export const BUILDINGS = Object.freeze([
  {
    id: 'home-player', name: 'Casa del protagonista', type: 'house', zone: 'residential',
    plot: { x: 6, y: 4, w: 9, d: 11 }, ground: 'grass', fence: true,
    footprint: { x: 8.4, y: 9.6, w: 4.2, d: 3.8 },
    solid: [{ x: 8.4, y: 9.6, w: 4.2, d: 4.2 }],
    door: { x: 9.5, y: 13.8 }, facing: 'S', access: { x: 8.6, y: 13.8, w: 2.2, d: 1.2 },
    path: [{ x: 9, y: 14, w: 2, d: 1 }],
    art: { kind: 'generated', key: 'home-protagonista' }
  },
  {
    id: 'camila', name: 'Casa de Camila', type: 'camila', zone: 'residential',
    plot: { x: 19, y: 4, w: 12, d: 11 }, ground: 'grass',
    footprint: { x: 20, y: 5, w: 10, d: 10 },
    solid: [{ x: 20, y: 5, w: 10, d: 10 }],
    door: { x: 28.4, y: 15 }, facing: 'S', access: { x: 26.6, y: 15, w: 3.4, d: 1 },
    path: [],
    art: { kind: 'png', key: 'camila-house-pixel', anchor: [705, 680], scale: 0.481 }
  },
  {
    id: 'home-a', name: 'Casa residencial A', type: 'house', zone: 'residential',
    plot: { x: 35, y: 4, w: 10, d: 11 }, ground: 'grass', fence: true,
    footprint: { x: 37.5, y: 9.4, w: 4, d: 3.4 },
    solid: [{ x: 37.5, y: 9.4, w: 4, d: 3.8 }],
    door: { x: 40.6, y: 13.2 }, facing: 'S', access: { x: 39.7, y: 13.2, w: 2, d: 1.6 },
    path: [{ x: 40, y: 13, w: 2, d: 2 }],
    art: { kind: 'generated', key: 'home-a' }
  },
  {
    id: 'station', name: 'Estación de Guaguas', type: 'station', zone: 'civic',
    plot: { x: 49, y: 4, w: 12, d: 11 }, ground: 'paving',
    footprint: { x: 50, y: 9, w: 7, d: 6 },
    solid: [{ x: 50.5, y: 9.4, w: 6, d: 3.6 }],
    door: { x: 53.5, y: 13 }, facing: 'S', access: { x: 51, y: 13, w: 5, d: 2 },
    path: [],
    art: { kind: 'png', key: 'bus-station-pixel', anchor: [774, 733], scale: 0.373, flipX: true },
    bay: { x: 49, y: 16, w: 10, d: 1 }
  },
  {
    id: 'fashion', name: 'Moda Urbana', type: 'fashion', zone: 'commercial',
    plot: { x: 9, y: 20, w: 11, d: 10 }, ground: 'grass',
    // The art's plate is skewed (long +x storefront, short side), so collision follows the measured walls:
    // facade on the line x = 13.55, body spanning y 20.3–27.75.
    footprint: { x: 11, y: 20.7, w: 4.1, d: 8.7 },
    solid: [{ x: 9.6, y: 20.3, w: 3.95, d: 7.45 }],
    door: { x: 13.55, y: 24.2 }, facing: 'E', access: { x: 13.55, y: 22.8, w: 6.45, d: 2.8 },
    path: [{ x: 14, y: 23, w: 6, d: 3 }],
    art: { kind: 'png', key: 'fashion-pixel', anchor: [768, 793], scale: 0.33 }
  },
  {
    id: 'market', name: 'Supermercado La Unión', type: 'market', zone: 'commercial',
    plot: { x: 48, y: 20, w: 15, d: 10 }, ground: 'paving',
    footprint: { x: 50, y: 22, w: 10, d: 7 },
    solid: [{ x: 50, y: 22, w: 10, d: 5.6 }],
    door: { x: 54.1, y: 27.6 }, facing: 'S', access: { x: 52.6, y: 27.6, w: 3.2, d: 2.4 },
    path: [],
    art: { kind: 'png', key: 'supermarket-pixel', anchor: [768, 739], scale: 0.36 }
  },
  {
    id: 'colmado', name: 'Colmado Don Ramón', type: 'colmado', zone: 'commercial',
    plot: { x: 25, y: 35, w: 18, d: 12 }, ground: 'paving',
    footprint: { x: 30, y: 35, w: 9, d: 9 },
    // Corner shop: the building sits in the back half of its plate and its facade is the diagonal x + y = 74.4
    // (horizontal on screen); the front half is terrace. Walls are therefore a triangle-ish polygon, not a rect.
    solid: [{ poly: [[30, 35], [39, 35], [39, 35.4], [30.4, 44], [30, 44]] }], frontSum: 74.4,
    door: { x: 34.7, y: 39.7 }, facing: 'SE', access: { x: 34.2, y: 39.5, w: 2.6, d: 2.6 },
    path: [],
    interior: 'ColmadoInteriorScene', prompt: '[E] ENTRAR AL COLMADO DON RAMÓN',
    art: { kind: 'png', key: 'colmado-pixel', anchor: [765, 816], scale: 0.4575 }
  },
  {
    id: 'home-c', name: 'Casa residencial C', type: 'house', zone: 'residential',
    plot: { x: 9, y: 35, w: 11, d: 12 }, ground: 'grass', fence: true,
    footprint: { x: 12, y: 40.4, w: 3.6, d: 3.4 },
    solid: [{ x: 12, y: 40.4, w: 3.6, d: 3.8 }],
    door: { x: 13.3, y: 43.8 }, facing: 'S', access: { x: 12.5, y: 44.2, w: 2, d: 1.6 },
    path: [{ x: 12, y: 44, w: 2, d: 3 }],
    art: { kind: 'generated', key: 'home-c' }
  },
  {
    id: 'home-b', name: 'Casa residencial B', type: 'house', zone: 'residential',
    plot: { x: 48, y: 35, w: 15, d: 12 }, ground: 'grass', fence: true,
    footprint: { x: 52, y: 40.6, w: 4.2, d: 3.2 },
    solid: [{ x: 52, y: 40.6, w: 4.2, d: 3.2 }],
    door: { x: 54.4, y: 43.8 }, facing: 'S', access: { x: 53.5, y: 43.8, w: 2.2, d: 2.2 },
    path: [{ x: 54, y: 44, w: 2, d: 3 }],
    art: { kind: 'generated', key: 'home-b' }
  }
]);

/** Where the player first appears, and where they re-appear when leaving the colmado. */
export const SPAWN = Object.freeze({ x: 34.5, y: 45.2 });

export const COLMADO_TABLES = Object.freeze([
  Object.freeze({ id: 'historia', name: 'HISTORIA', label: 'DOMINÓ HISTORIA\n(OFFLINE)', x: 30.4, y: 45.6, variant: 'white' }),
  Object.freeze({ id: 'online', name: 'ONLINE', label: 'DOMINÓ ONLINE\n(MULTIJUGADOR)', x: 38.6, y: 45.6, variant: 'red' })
]);
