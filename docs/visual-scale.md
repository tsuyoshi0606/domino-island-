# Barrio Los Robles — plano, escala y reglas del mapa

Todo el mapa se define en **un único sistema de coordenadas** (tiles finales de la cuadrícula, sin desplazamientos ocultos). La fuente de verdad es `src/world/losRobles.js`; el terreno, las colisiones, la profundidad y el dibujo se **derivan** de esos datos.

## Terreno y cámara

- Cuadrícula lógica: **72 × 56 tiles**, margen paisajístico de **4 tiles** (área jugable: x 4–67, y 4–51).
- Tile isométrico: **64 × 32 px**. Proyección: `screenX = (x − y) × 32`, `screenY = (x + y) × 16`. El eje **x** baja hacia la derecha y el eje **y** baja hacia la izquierda.
- Vista general: zoom **0.29**. Vista de juego: zoom **0.76** con seguimiento del personaje.
- Escala de referencia: el personaje mide **100 px**; las puertas de las viviendas, **~108 px**.

## Plano urbano

```
N   y 4–14    Casa del protagonista · Casa de Camila · Casa residencial A · Estación de Guaguas
    y 15–19   Avenida Los Robles (H1)
M   y 20–29   Moda Urbana · Parque Los Robles · Supermercado La Unión
    y 30–34   Calle del Parque (H2)
S   y 35–46   Casa residencial C · Colmado Don Ramón (+ plaza) · Casa residencial B
    y 47–51   Calle del Colmado (H3)
```

Calles verticales: V0 (x 4–8), V1 (x 20–24), V2 (x 43–47), V3 (x 63–67). Cada calle son **3 carriles de calzada** y **1 acera por lado**; las aceras se generan solas alrededor de la calzada y se conectan entre manzanas con pasos de peatones.

Cada edificio mira hacia una calle situada **al sur o al este** (las caras que muestran los sprites isométricos), y tiene un camino pavimentado que lo une con la acera.

| Lugar | Parcela (x, y, ancho × fondo) | Huella del arte | Diseño |
| --- | --- | --- | --- |
| Casa del protagonista | 6, 4 · 9 × 11 | 4.2 × 3.8 | `home-protagonista` (concreto beige, terraza, tinaco) |
| Casa de Camila | 19, 4 · 12 × 11 | 10 × 10 | `camila-house-pixel.png` |
| Casa residencial A | 35, 4 · 10 × 11 | 4.0 × 3.4 | `home-a` (amarillo arena, porche lateral) |
| Estación de Guaguas | 49, 4 · 12 × 11 | 7 × 6 | `bus-station-pixel.png` (reflejada), con bahía en la avenida |
| Moda Urbana | 9, 20 · 11 × 10 | 4.1 × 8.7 | `fashion-pixel.png` (fachada hacia el este) |
| Parque Los Robles | 25, 20 · 18 × 10 | — | plaza, caminos, 4 bancos, 2 mesas, mango central |
| Supermercado La Unión | 48, 20 · 15 × 10 | 10 × 7 | `supermarket-pixel.png` |
| Colmado Don Ramón | 25, 35 · 18 × 12 | 9 × 9 | `colmado-pixel.png` (esquina achaflanada) |
| Casa residencial C | 9, 35 · 11 × 12 | 3.6 × 3.4 | `home-c` (salmón, techo de zinc a dos aguas) |
| Casa residencial B | 48, 35 · 15 × 12 | 4.2 × 3.2 | `home-b` (turquesa, patio con techo azul) |

## Reglas que cumple el mapa (verificadas por `npm run audit:world`)

- Cada edificio ocupa su parcela; ninguno invade calzada, acera ni otra parcela.
- Una sola red vial conectada y una sola red de aceras (unidas por los pasos de peatones).
- **Marcas viales con función**: una línea central amarilla discontinua por calle (separa sentidos), interrumpida en cada cruce; cebras en los brazos de cada cruce; bordillo amarillo solo en la bahía de la estación.
- Vehículos solo en el carril exterior, alineados con la calle, sin tapar cruces ni pasos de peatones.
- Mesas de dominó solo en zonas sociales (parque y plaza del colmado); bancos solo en el parque.

## Colisiones (`src/world/collision.js`)

Se resuelven en **espacio de tiles**: las paredes son rectángulos (o polígonos convexos) alineados con el mapa y los pies del personaje son un círculo de 0.3 tiles, que en pantalla es la elipse 2:1 de la perspectiva. Al chocar, el personaje **se desliza** a lo largo de la pared.

- `solid` de cada edificio = sus paredes reales (no la parcela). La terraza o el jardín delantero siguen siendo transitables.
- El Colmado es una **esquina achaflanada**: su fachada es la diagonal `x + y = 74.4`, así que sus paredes son un polígono, no un rectángulo.
- `access` de cada edificio es la **zona de interacción** frente a la puerta. Solo ahí aparece el aviso `[E]`.
- Las casas están rodeadas por una valla baja con un portón en el camino de entrada.

## Profundidad (`src/world/depth.js`)

No hay valores de profundidad por sprite. Cada objeto que puede ocultar a alguien se registra con su huella, y se ordena con la regla isométrica: *A está detrás de B si queda por completo al otro lado de B en x o en y*. De ese orden parcial sale un rango único por objeto; el personaje se coloca entre los rangos de lo que tiene delante y detrás según su posición en tiles. Los pares ambiguos (lejos en pantalla) se ignoran.

## Cómo se ajusta un edificio

1. Edita su entrada en `BUILDINGS` (`losRobles.js`): `footprint` (rombo donde se dibuja el arte), `solid` (paredes), `door`, `access`, `path`.
2. Para sprites PNG, `art.anchor` es el píxel de la imagen que cae en el centro de la huella y `art.scale` su escala.
3. Pulsa **C** en el juego: rojo = colisiones, verde = zonas de interacción, amarillo = huellas del arte, azul = límite jugable. Ajusta hasta que cuadren con el dibujo.
4. Ejecuta `npm run audit:world`.

## Limitaciones conocidas

- Los PNG generados con IA no tienen una perspectiva 2:1 perfecta (la plataforma de Moda Urbana y la del supermercado están ligeramente sesgadas), por lo que la colisión sigue las **paredes medidas** y no el borde exacto de la plataforma.
- El interior del Colmado sigue siendo la escena 2D original. Camila, Moda Urbana, el supermercado, las casas y la estación todavía no tienen interior (sus zonas de acceso están definidas para cuando lo tengan).
