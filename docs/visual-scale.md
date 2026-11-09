# Barrio Los Robles — escala y plano

## Terreno y cámara

- Cuadrícula lógica: **72 × 56 tiles**, con **4 tiles de margen** alrededor del barrio construido.
- Tile isométrico: **64 × 32 px**. Proyección: `screenX = (x - y) × 32`, `screenY = (x + y) × 16`.
- Vista general: zoom **0.29**, centrada en el centro geométrico del terreno. El borde continuo enmarca el suelo; las calles terminan en conexiones internas.
- Vista de juego: zoom **0.76** y seguimiento del protagonista. `L` muestra u oculta etiquetas; al acercarse al jugador, se ocultan automáticamente.

Las coordenadas de `SITES` conservan el plano base del barrio; `ExteriorScene` suma el margen de cuatro tiles al renderizarlas. Las dimensiones usan rectángulos semiabiertos `[x, x + ancho) × [y, y + profundidad)`.

## Parcelas renderizadas

| Lugar | X, Y | Ancho × profundidad |
| --- | --- | --- |
| Casa de Camila | 18, 8 | 12 × 10 |
| Residencial A | 38, 8 | 10 × 9 |
| Estación de guaguas | 53, 9 | 11 × 8 |
| Moda Urbana | 17, 23 | 12 × 10 |
| Parque Los Robles | 32, 22 | 16 × 12 |
| Supermercado La Unión | 51, 23 | 13 × 10 |
| Casa del protagonista | 7, 38 | 10 × 9 |
| Colmado Don Ramón | 28, 38 | 17 × 10 |
| Residencial B | 51, 39 | 10 × 9 |
| Residencial C | 7, 26 | 9 × 8 |

Cada parcela tiene bordillo, acceso y superficie dedicada. La casa del protagonista utiliza la vivienda de concreto beige con puerta, ventanas enrejadas, tinaco y jardín, en lugar de la variante azul anterior.

## Red vial y límites

| Calle | Celdas renderizadas |
| --- | --- |
| Vía A | Y 18–21, X 4–67 |
| Conector oeste | X 4–6, Y 18–51 |
| Conector central oeste | X 29–31, Y 18–37 |
| Conector central este | X 48–50, Y 18–51 |
| Vía comercial C | Y 34–36, X 4–67 |
| Vía residencial E | Y 49–51, X 4–67 |
| Conector este | X 65–67, Y 18–51 |

La red forma un circuito conectado y queda separada del perímetro por la franja verde de seguridad. Los cruces peatonales se sitúan en los dos conectores que atraviesan cada vía horizontal. Las marcas viales se dibujan únicamente dentro de las celdas de asfalto.

Las mesas del colmado ocupan los tiles locales `(27,42)` y `(37,43)`, trasladados al margen de mapa en la escena. Quedan a ambos lados del acceso `(32,41)` y dentro de la parcela pavimentada. El edificio se retranqueó dos tiles para dejar una terraza libre delante de la puerta y las mesas.

La auditoría automática se ejecuta con `npm run audit:world`. Comprueba límites y margen, solapamiento de parcelas, cruce de calles con edificios, conectividad vial, entradas, mesas y vehículos.

## Recursos visuales

Las escalas de arquitectura se ajustan en `ExteriorScene.js`. La cámara conserva `pixelArt`, `antialias: false` y `roundPixels`. El inventario de sprites originales y los recursos todavía provisionales aparece en `docs/pixel-art-assets.md`.
