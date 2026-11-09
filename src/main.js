import Phaser from 'phaser';
import { ExteriorScene } from './scenes/ExteriorScene.js';
import { ColmadoInteriorScene } from './scenes/ColmadoInteriorScene.js';
import './style.css';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#14271e',
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, min: { width: 800, height: 450 } },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [ExteriorScene, ColmadoInteriorScene]
};

new Phaser.Game(config);
