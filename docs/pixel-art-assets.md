# Assets pixel art y estado visual

## Sprites integrados

Los PNG son elementos independientes con alfa; el mapa no usa ninguna de estas imágenes como fondo. Proceden de generaciones basadas en los PNG oficiales de `D:/DESCARGAS` y conservan arquitectura, paleta e isometría del proyecto.

| Recurso | Archivo | Uso |
| --- | --- | --- |
| Colmado | `colmado-pixel.png` | Fachada, toldo, mercancía, neveras, cajas, botellones y techo con tinaco; el nombre se superpone con texto del juego. |
| Casa de Camila | `camila-house-pixel.png` | Dos niveles, balcón, escalera, verja y jardín con trinitarias. |
| Moda Urbana | `fashion-pixel.png` | Toldo, escaparates con ropa y maniquíes. |
| Supermercado La Unión | `supermarket-pixel.png` | Escaparates con productos, puertas de cristal y carritos. |
| Estación de Guaguas | `bus-station-pixel.png` | Techo, poste, banco y panel de rutas. |
| Árbol de mango | `mango-tree-pixel.png` | Follaje amplio, frutos visibles y tronco central del parque (escala 0.25). |
| Protagonista | `protagonist-sheet.png` | 4 filas por 4 columnas: reposo y tres cuadros de caminata para frente, atrás, izquierda y derecha. |

En el atlas de personaje cada cuadro usa un recorte de **313 × 313 px** de una hoja de 1254 × 1254 px. Los 2 píxeles finales de margen se dejan fuera del atlas.

## Sprites generados (`scripts/generate-sprites.mjs`)

Los recursos que antes eran SVG provisionales se sustituyeron por sprites isométricos generados **sobre la cuadrícula real de 64 × 32 px**, de modo que su huella coincide con sus tiles y las sombras caen hacia +x. Se regeneran con `npm run generate:sprites` (escribe `public/assets/prototype/generated/*.svg` y `src/world/generatedSprites.js`).

| Recurso | Archivos | Notas |
| --- | --- | --- |
| Viviendas (4 diseños distintos) | `home-protagonista`, `home-a`, `home-b`, `home-c` | Antes `house.svg`, `house-b.svg` y `house-c.svg` eran el mismo modelo recoloreado con el cuerpo flotando ~70 px sobre su plataforma. |
| Vehículos | `car-{red,blue,white}-{x,y}-{front,rear}` | Orientados con el eje de la calle (antes: vista lateral plana girada ±27°). |
| Mesas de dominó | `domino-table-white`, `domino-table-red` | Isométricas, con sillas. |
| Bancos | `bench-{n,s,e,w}` | Según hacia dónde mira el respaldo. |
| Basurero | `bin` | |

Los SVG originales (`house*.svg`, `car.svg`, `domino-table.svg`, `camila-house.svg`, etc.) **se conservan** en `public/assets/prototype/` pero ya no se cargan. `palm.svg` sigue en uso.

## Estado provisional

Las farolas, los arbustos de trinitaria, los parterres y los desagües se dibujan con primitivas de Phaser (`src/render/propRenderer.js`). Siguen pendientes de sustituirse por pixel art. Las viviendas generadas usan trazo vectorial nítido, no el pixel art detallado de los PNG principales.

## Cámara y píxeles

Phaser mantiene `pixelArt: true`, `antialias: false` y `roundPixels: true`. El zoom de escena escala los recursos con filtrado de píxel; la vista de juego sigue al personaje y la vista general presenta el mapa completo.
