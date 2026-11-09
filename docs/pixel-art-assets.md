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
| Árbol de mango | `mango-tree-pixel.png` | Follaje amplio, frutos visibles y tronco central del parque. |
| Protagonista | `protagonist-sheet.png` | 4 filas por 4 columnas: reposo y tres cuadros de caminata para frente, atrás, izquierda y derecha. |

En el atlas de personaje cada cuadro usa un recorte de **313 × 313 px** de una hoja de 1254 × 1254 px. Los 2 píxeles finales de margen se dejan fuera del atlas.

## Estado provisional

La casa del protagonista se asigna al SVG beige `house.svg`, que incluye fachada de una planta, rejas, puerta, techo de concreto, tinaco, patio y jardín. Las otras casas (`house-b.svg`, `house-c.svg`), palmeras, carros y mesas de dominó siguen siendo SVG temporales; parte del mobiliario del parque y las farolas se dibuja con primitivas Phaser. El diseño azul antiguo (`house-player.svg`) ya no se usa. Esos elementos siguen pendientes de sustituirse por un atlas de pixel art consistente.

## Cámara y píxeles

Phaser mantiene `pixelArt: true`, `antialias: false` y `roundPixels: true`. El zoom de escena escala los recursos con filtrado de píxel; la vista de juego sigue al personaje y la vista general presenta el mapa completo.
