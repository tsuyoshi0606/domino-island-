# Dominó Island — Barrio Los Robles

Prototipo jugable en Phaser 3 con un barrio isométrico sobre una cuadrícula de 72 × 56 celdas (tiles de 64 × 32 px) y un margen perimetral de cuatro celdas. El barrio tiene tres avenidas, cuatro calles transversales, diez parcelas y un parque central.

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
- Mostrar la capa de colisiones y zonas de interacción (depuración): C.
- La fila de botones en pantalla permite cambiar de vista y guardar capturas PNG en `screenshots/`.

## Mapa

El mapa se define como **datos** en `src/world/losRobles.js` (calles, parcelas, edificios con huella, paredes, puertas y zonas de acceso). De ahí se derivan, en módulos independientes de Phaser: el terreno y las marcas viales (`terrain.js`), las colisiones (`collision.js`), el orden de profundidad (`depth.js`) y la decoración (`props.js`); `world.js` los reúne. El dibujo vive en `src/render/` y `ExteriorScene` solo coordina cámara, controles, HUD y movimiento. Plano, escala y reglas: `docs/visual-scale.md`.

Comandos de verificación:

```bash
npm run audit:world      # geometría, conectividad, colisiones, profundidad y recursos (32 comprobaciones)
npm run generate:sprites # regenera las viviendas, coches, mesas y bancos isométricos
npm run build
```

El exterior combina sprites pixel art con transparencia (colmado, árbol central, Casa de Camila, Moda Urbana, supermercado, estación y protagonista animado) con sprites isométricos generados para las viviendas, los coches, las mesas de dominó y los bancos. No hay una imagen completa usada como fondo. El inventario visual y los recursos todavía provisionales están descritos en `docs/pixel-art-assets.md`.
