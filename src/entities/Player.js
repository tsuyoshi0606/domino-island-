import Phaser from 'phaser';

/** Reference-matched avatar with four directional sprite rows and depth sorting. */
export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.shadow = scene.add.ellipse(0, -2, 38, 12, 0x17211b, 0.42);
    this.avatar = scene.add.sprite(0, -40, 'protagonist-sheet', 0).setScale(0.32);
    this.add([this.shadow, this.avatar]);
    this.setSize(48, 96); this.setDepth(y);
    scene.add.existing(this);
    this.speed = 128;
  }

  updateSprite(vx, vy, moving, time = 0) {
    // ExteriorScene passes screen-space velocity so each key animates the matching facing row.
    const screenDx = vx, screenDy = vy;
    let row = 0; // front/down
    if (Math.abs(screenDx) > Math.abs(screenDy)) row = screenDx < 0 ? 2 : 3;
    else if (screenDy < 0) row = 1;
    const frame = moving ? row * 4 + 1 + Math.floor(time / 130) % 3 : row * 4;
    this.avatar.setFrame(frame);
    this.avatar.y = moving ? -41 + (Math.sin(time / 70) > 0 ? 2 : 0) : -40;
  }
}
