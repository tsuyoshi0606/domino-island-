export class IsometricSystem {
  constructor(tileWidth = 64, tileHeight = 32, originX = 0, originY = 0) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.originX = originX;
    this.originY = originY;
  }
  toScreen(tileX, tileY) {
    return {
      x: this.originX + (tileX - tileY) * this.tileWidth / 2,
      y: this.originY + (tileX + tileY) * this.tileHeight / 2
    };
  }
  toTile(screenX, screenY) {
    const x = screenX - this.originX;
    const y = screenY - this.originY;
    return { x: x / this.tileWidth + y / this.tileHeight, y: y / this.tileHeight - x / this.tileWidth };
  }
}
