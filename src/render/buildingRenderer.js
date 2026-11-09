import { GENERATED_SPRITES } from '../world/generatedSprites.js';
import { SVG_SCALE } from './propRenderer.js';

// Signage lettering is placed on the facade in sprite pixels (relative to the ground anchor of the art),
// so it follows the sprite's scale and is rotated to the slope of the face it sits on.
const SIGNS = {
  colmado: { text: 'Colmado\nDon Ramón', dx: 35, dy: -378, size: 72, color: '#fff4d8', stroke: '#78312a', angle: 3, spacing: -12 },
  fashion: { text: 'Moda Urbana', dx: 112, dy: -453, size: 100, color: '#fff4d8', stroke: '#233b88', angle: -26.5, spacing: -5 },
  market: { text: 'Supermercado\nLa Unión', dx: -138, dy: -369, size: 84, color: '#fff4d8', stroke: '#8f2926', angle: 26.5, spacing: -8 }
};
const LABEL_LIFT = { house: 215, camila: 330, station: 255 };

export function addBuilding(scene, world, iso, b) {
  const p = iso.toScreen(b.center.x, b.center.y);
  const depth = world.sorter.depthOf(b.id);
  const objs = [];
  if (b.art.kind === 'png') {
    const src = scene.textures.get(b.art.key).getSourceImage();
    const ax = b.art.flipX ? src.width - b.art.anchor[0] : b.art.anchor[0];
    const img = scene.add.image(p.x, p.y, b.art.key).setOrigin(ax / src.width, b.art.anchor[1] / src.height).setScale(b.art.scale).setFlipX(!!b.art.flipX).setDepth(depth);
    objs.push(img);
    const sign = SIGNS[b.type];
    if (sign) {
      const s = b.art.scale;
      const t = scene.add.text(p.x + sign.dx * s, p.y + sign.dy * s, sign.text, {
        fontFamily: 'Arial, sans-serif', fontSize: `${Math.round(sign.size * s)}px`, fontStyle: 'bold', align: 'center',
        lineSpacing: sign.spacing * s, color: sign.color, stroke: sign.stroke, strokeThickness: Math.max(3, Math.round(12 * s))
      }).setOrigin(0.5).setAngle(sign.angle).setDepth(depth + 1);
      objs.push(t);
    }
  } else {
    const g = GENERATED_SPRITES[b.art.key];
    objs.push(scene.add.image(p.x, p.y, b.art.key).setOrigin(g.originX, g.originY).setScale(1 / SVG_SCALE).setDepth(depth));
  }
  objs.forEach(o => o.setData('buildingId', b.id));
  return objs;
}

/** Small name tag for places without lettering of their own. */
export function addPoiLabel(scene, iso, b) {
  const p = iso.toScreen(b.center.x, b.center.y);
  const label = scene.add.text(p.x, p.y - (LABEL_LIFT[b.type] ?? 200), b.name, {
    fontFamily: 'monospace', fontSize: '23px', fontStyle: 'bold', color: '#fff0ce', stroke: '#242320', strokeThickness: 5, backgroundColor: '#29251f', padding: { x: 7, y: 4 }
  }).setOrigin(0.5).setDepth(20000);
  label.setData('poi', true);
  return { label, point: p };
}
