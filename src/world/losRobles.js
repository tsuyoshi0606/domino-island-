// Four perimeter tiles create a deliberate landscaped margin around the playable district.
export const WORLD = Object.freeze({ columns: 72, rows: 56, tileWidth: 64, tileHeight: 32, margin: 4 });

// Colmado tables use unshifted district coordinates; the scene applies WORLD.margin.
export const COLMADO_TABLES = Object.freeze([
  Object.freeze({ id: 'historia', name: 'HISTORIA', x: 27, y: 42 }),
  Object.freeze({ id: 'online', name: 'ONLINE', x: 37, y: 43 })
]);

// Parcel rectangles use [x, x + width) × [y, y + depth).
// Two small edits separate originally overlapping lots without changing district order.
export const SITES = [
  { id: 'camila', name: 'Casa de Camila', type: 'camila', x: 14, y: 4, width: 12, depth: 10, door: [20, 13], scale: 1.12 },
  { id: 'home-a', name: 'Casa residencial A', type: 'house', x: 34, y: 4, width: 10, depth: 9, door: [39, 12], scale: 1.22, tint: 0xf2d7a5 },
  { id: 'station', name: 'Estación de Guaguas', type: 'station', x: 49, y: 5, width: 11, depth: 8, door: [54, 12], scale: 1.05 },
  { id: 'fashion', name: 'Moda Urbana', type: 'fashion', x: 13, y: 19, width: 12, depth: 10, door: [19, 28], scale: 1.05 },
  { id: 'park', name: 'Parque Los Robles', type: 'park', x: 28, y: 18, width: 16, depth: 12, door: [36, 29] },
  { id: 'market', name: 'Supermercado La Unión', type: 'market', x: 47, y: 19, width: 13, depth: 10, door: [53, 28], scale: 1.0 },
  { id: 'home-player', name: 'Casa del protagonista', type: 'house', x: 3, y: 34, width: 10, depth: 9, door: [8, 42], scale: 1.28, tint: 0xffe0a2 },
  { id: 'colmado', name: 'Colmado Don Ramón', type: 'colmado', x: 24, y: 34, width: 17, depth: 10, door: [32, 41], scale: 1.38 },
  { id: 'home-b', name: 'Casa residencial B', type: 'house', x: 47, y: 35, width: 10, depth: 9, door: [52, 43], scale: 1.22, tint: 0xc7e1df },
  { id: 'home-c', name: 'Casa residencial C', type: 'house', x: 3, y: 22, width: 9, depth: 8, door: [7, 29], scale: 1.12, tint: 0xf1b9ad }
];

export const STREETS = [
  // Roads form a connected internal grid with landscaped caps before the map edge.
  { id: 'A', label: 'Vía principal posterior', kind: 'horizontal', from: 4, to: 68, start: 18, width: 4 },
  { id: 'B-west', label: 'Vía central oeste', kind: 'vertical', from: 18, to: 38, start: 29, width: 3 },
  { id: 'B-east', label: 'Vía central este', kind: 'vertical', from: 18, to: 52, start: 48, width: 3 },
  { id: 'C', label: 'Vía comercial', kind: 'horizontal', from: 4, to: 68, start: 34, width: 3 },
  { id: 'E', label: 'Vía residencial inferior', kind: 'horizontal', from: 4, to: 68, start: 49, width: 3 },
  { id: 'west-link', label: 'Conector oeste', kind: 'vertical', from: 18, to: 52, start: 4, width: 3 },
  { id: 'east-link', label: 'Conector este', kind: 'vertical', from: 18, to: 52, start: 65, width: 3 }
];

// Site coordinates retain a readable district plan; the renderer translates them into
// the four-tile safety margin of the larger terrain grid.
