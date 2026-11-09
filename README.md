# Dominó Island — Barrio Los Robles

Prototipo jugable en Phaser 3 con un barrio isométrico sobre una cuadrícula de 72 × 56 celdas (tiles de 64 × 32 px) y un margen perimetral de cuatro celdas.

## Ejecutar localmente

Requisitos: Node.js 20 o superior y npm.

```bash
npm install
npm run dev
```

Abre la dirección local que muestra Vite. Para generar una compilación: `npm run build`.

## Controles

- Mover al protagonista: WASD o flechas.
- Acercar o alejar: rueda del ratón.
- Desplazar cámara: arrastrar con el botón derecho.
- Entrar al Colmado Don Ramón: acércate a la entrada y pulsa E.
- En el colmado, volver al barrio: E o Esc junto a la salida.
- Vistas rápidas: 1 mapa, 2 colmado, 3 parque, 4 comercios, 5 protagonista.
- Mostrar u ocultar etiquetas del mapa: L.
- La fila de botones en pantalla permite cambiar de vista y guardar capturas PNG en `screenshots/`.

## Mapa

La distribución se define con coordenadas X/Y, parcelas y calles en `src/world/losRobles.js`. El terreno, el borde elevado, la red vial, los edificios, el parque y la cámara se construyen en `src/scenes/ExteriorScene.js`. `npm run audit:world` valida parcelas, margen, accesos, calles conectadas, mesas y vehículos. La escala y el plano están descritos en `docs/visual-scale.md`.

El exterior combina sprites pixel art con transparencia (colmado, árbol central, Casa de Camila, Moda Urbana, supermercado, estación y protagonista animado) con recursos SVG provisionales para algunas viviendas y mobiliario secundario. La casa del protagonista usa la vivienda beige con tinaco y rejas. No hay una imagen completa usada como fondo. El inventario visual y los recursos todavía provisionales están descritos en `docs/pixel-art-assets.md`.
