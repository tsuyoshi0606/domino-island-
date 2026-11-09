import { GENERATED_SPRITES } from '../world/generatedSprites.js';
import { GROUND_DEPTH } from './terrainRenderer.js';

/** Textures needed by props and buildings. Generated SVGs are rasterised at 2× and shown at ½ for crisp native pixels. */
export const SVG_SCALE = 2;
export function preloadGenerated(scene) {
  for (const [key, g] of Object.entries(GENERATED_SPRITES)) scene.load.svg(key, `/assets/prototype/${g.file}`, { scale: SVG_SCALE });
  scene.load.svg('palm', '/assets/prototype/palm.svg', { scale: SVG_SCALE });
}

function lamp(scene, x, y, height) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x12201a, 0.3); g.fillEllipse(14, 2, 34, 11);                // ground shadow, cast toward +x
  g.fillStyle(0x242729, 1); g.fillRect(-3, -height, 6, height); g.fillRect(-6, -8, 12, 8);
  g.fillRect(-13, -height - 3, 26, 4);                                     // cross arm
  for (const dx of [-12, 12]) { g.fillStyle(0xffdc77, 1); g.fillCircle(dx, -height - 10, 7); g.fillStyle(0xfff2c0, 0.8); g.fillCircle(dx - 2, -height - 12, 2.5); }
  return g;
}

function bush(scene, x, y) { // bougainvillea
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x12201a, 0.25); g.fillEllipse(16, 6, 56, 14);
  g.fillStyle(0x386a3b, 1); g.fillEllipse(0, -4, 54, 24); g.fillEllipse(-14, -14, 26, 20); g.fillEllipse(14, -12, 28, 20);
  for (let i = 0; i < 11; i++) {
    const px = -22 + (i % 6) * 8.5, py = -22 + Math.floor(i / 6) * 11 + (i % 2) * 4;
    g.fillStyle(i % 3 ? 0xe95787 : 0xf0c547, 1); g.fillCircle(px, py, 5); g.fillStyle(0xffedbf, 1); g.fillCircle(px, py, 1.5);
  }
  return g;
}

function flowerbed(scene, x, y) { // flat planter decal
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x966d46, 1); g.fillPoints([{ x: -47, y: 5 }, { x: 0, y: 19 }, { x: 47, y: 5 }, { x: 0, y: -9 }], true);
  g.fillStyle(0x277b42, 1); g.fillPoints([{ x: -41, y: 0 }, { x: 0, y: 12 }, { x: 41, y: 0 }, { x: 0, y: -12 }], true);
  for (let i = 0; i < 7; i++) { g.fillStyle(i % 2 ? 0xe84c81 : 0xefbc37, 1); g.fillCircle(-28 + i * 9, -3 + (i % 2) * 6, 4); }
  return g;
}

function drain(scene, x, y) {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x494a48, 1); g.fillPoints([{ x: -16, y: 0 }, { x: 0, y: -8 }, { x: 16, y: 0 }, { x: 0, y: 8 }], true);
  g.lineStyle(1, 0xaaa18e, 0.85); for (let i = -2; i <= 2; i++) g.lineBetween(i * 5, -6, i * 5, 6);
  return g;
}

/** Adds one prop; returns the display object (depth already set from the world's depth order). */
export function addProp(scene, world, iso, prop) {
  const { render } = prop.spec, p = iso.toScreen(prop.x, prop.y);
  const depth = prop.solid ? world.sorter.depthOf(prop.id) : null;
  let obj;
  switch (render.kind) {
    case 'generated': {
      const g = GENERATED_SPRITES[render.key];
      obj = scene.add.image(p.x, p.y, render.key).setOrigin(g.originX, g.originY).setScale(1 / SVG_SCALE);
      break;
    }
    case 'png': {
      const src = scene.textures.get(render.key).getSourceImage();
      obj = scene.add.image(p.x, p.y, render.key).setOrigin(render.anchor[0] / src.width, render.anchor[1] / src.height).setScale(render.scale);
      break;
    }
    case 'svg': obj = scene.add.image(p.x, p.y, render.key).setOrigin(...render.origin).setScale(render.scale / SVG_SCALE); break;
    case 'lamp': obj = lamp(scene, p.x, p.y, render.height); break;
    case 'bush': obj = bush(scene, p.x, p.y); break;
    case 'flowerbed': obj = flowerbed(scene, p.x, p.y); break;
    case 'drain': obj = drain(scene, p.x, p.y); break;
    default: throw new Error(`Unknown render kind ${render.kind}`);
  }
  obj.setDepth(depth ?? GROUND_DEPTH.decals);
  obj.setData('propId', prop.id);
  return obj;
}

/** Low masonry fence segments around house plots. */
export function addFence(scene, world, iso, f) {
  const g = scene.add.graphics().setDepth(world.sorter.depthOf(f.id));
  const H = 16;
  const a = iso.toScreen(f.x0, f.y0), b = iso.toScreen(f.x1, f.y0), c = iso.toScreen(f.x1, f.y1), d = iso.toScreen(f.x0, f.y1);
  const up = pt => ({ x: pt.x, y: pt.y - H });
  g.fillStyle(0xb8a07a, 1); g.fillPoints([up(a), up(b), up(c), up(d)], true);               // top
  g.fillStyle(0xcdb58c, 1); g.fillPoints([d, c, up(c), up(d)], true);                         // +y face
  g.fillStyle(0x9d8662, 1); g.fillPoints([c, b, up(b), up(c)], true);                         // +x face
  g.lineStyle(1, 0x5a4934, 0.9); g.strokePoints([up(a), up(b), up(c), up(d)], true); g.lineBetween(d.x, d.y, up(d).x, up(d).y); g.lineBetween(c.x, c.y, up(c).x, up(c).y);
  return g;
}
