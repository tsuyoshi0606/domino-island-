import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { IsometricSystem } from '../systems/IsometricSystem.js';
import { COLMADO_TABLES, PARK, SPAWN, WORLD } from '../world/losRobles.js';
import { createWorld } from '../world/world.js';
import { PLAYER_RADIUS, inRect, moveInTiles } from '../world/collision.js';
import { drawTerrain, drawWorldBoundary } from '../render/terrainRenderer.js';
import { addProp, addFence, preloadGenerated } from '../render/propRenderer.js';
import { addBuilding, addPoiLabel } from '../render/buildingRenderer.js';
import { createDebugOverlay } from '../render/debugOverlay.js';

const PNG_ASSETS = {
  'colmado-pixel': 'colmado-pixel.png', 'camila-house-pixel': 'camila-house-pixel.png', 'fashion-pixel': 'fashion-pixel.png',
  'supermarket-pixel': 'supermarket-pixel.png', 'bus-station-pixel': 'bus-station-pixel.png', 'mango-tree-pixel': 'mango-tree-pixel.png'
};

// Hot-keys 0–9 jump to a view; each is a building id (or 'park'), centred on its footprint.
const VIEWS = {
  0: ['home-player', 0.72, 'residencial'], 2: ['colmado', 0.7, 'colmado'], 3: ['park', 0.72, 'parque'],
  6: ['camila', 0.62, 'camila'], 7: ['fashion', 0.64, 'moda'], 8: ['market', 0.62, 'supermercado'], 9: ['station', 0.72, 'guaguas']
};

export class ExteriorScene extends Phaser.Scene {
  constructor() { super('ExteriorScene'); }

  init(data) { this.arrival = data?.from ?? null; }

  preload() {
    for (const [key, file] of Object.entries(PNG_ASSETS)) this.load.image(key, `/assets/prototype/${file}`);
    preloadGenerated(this);
    this.load.spritesheet('protagonist-sheet', '/assets/prototype/protagonist-sheet.png', { frameWidth: 313, frameHeight: 313 });
  }

  create() {
    this.cameras.main.setBackgroundColor('#15231d');
    this.iso = new IsometricSystem(WORLD.tileWidth, WORLD.tileHeight, 0, 0);
    this.cameras.main.setBounds(-1824, -32, 4160, 2112);
    this.world = createWorld();

    drawTerrain(this, this.world, this.iso);            // ground, curbs, markings, plot outlines
    this.placeBuildings();                              // sprites sit on their footprints
    for (const f of this.world.fences) addFence(this, this.world, this.iso, f);
    for (const p of this.world.props) addProp(this, this.world, this.iso, p);
    this.placeParkLabel();
    drawWorldBoundary(this, this.iso);
    this.debug = createDebugOverlay(this, this.world, this.iso);

    // Arriving from the colmado puts the player on its front plaza, in front of the door.
    const colmado = this.world.buildings.find(b => b.id === 'colmado');
    const spawn = this.arrival === 'colmado' ? { x: colmado.door.x, y: colmado.door.y + 1.4 } : SPAWN;
    this.tile = { x: spawn.x, y: spawn.y };
    const at = this.iso.toScreen(this.tile.x, this.tile.y);
    this.player = new Player(this, at.x, at.y);
    this.setupCameraAndControls();
    if (this.arrival) this.focusView('5'); // coming back from an interior: resume following the player
    this.createHud();
  }

  placeBuildings() {
    this.siteDoors = []; this.poiLabels = [];
    for (const b of this.world.buildings) {
      addBuilding(this, this.world, this.iso, b);
      this.siteDoors.push({ ...b, point: this.iso.toScreen(b.door.x, b.door.y) });
      if (!['colmado', 'fashion', 'market'].includes(b.type)) this.poiLabels.push(addPoiLabel(this, this.iso, b));
    }
    for (const tag of COLMADO_TABLES) { // each colmado table carries its game-mode tag
      const table = this.world.props.find(p => p.type.startsWith('domino-table') && p.x === tag.x && p.y === tag.y);
      const p = this.iso.toScreen(tag.x, tag.y + 1.45);
      this.add.text(p.x, p.y, tag.label, {
        fontFamily: 'monospace', fontSize: '18px', align: 'center', color: '#fff1d4', stroke: '#38281d', strokeThickness: 4, backgroundColor: '#50351f', padding: { x: 5, y: 3 }
      }).setOrigin(0.5).setDepth(this.world.sorter.depthAbove(table.id, 1));
    }
  }

  placeParkLabel() {
    const p = this.iso.toScreen(PARK.center.x, PARK.rect.y + PARK.rect.d - 0.3);
    const label = this.add.text(p.x, p.y, 'PARQUE LOS ROBLES', { fontFamily: 'monospace', fontSize: '23px', color: '#fff0cc', stroke: '#263426', strokeThickness: 5, backgroundColor: '#315d38', padding: { x: 6, y: 3 } }).setOrigin(0.5).setDepth(20000);
    label.setData('poi', true); this.poiLabels.push({ label, point: this.iso.toScreen(PARK.center.x, PARK.center.y) });
  }

  // ---- camera & controls (unchanged behaviour, plus C = collision overlay) --------------------------------------
  setupCameraAndControls() {
    const camera = this.cameras.main;
    camera.setZoom(0.29); camera.centerOn(256, 1024);
    this.followPlayer = false;
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,R,F,L,C,ZERO,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,NINE,P');
    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.input.on('wheel', (_pointer, _objects, _dx, dy) => {
      camera.setZoom(Phaser.Math.Clamp(camera.zoom * (dy < 0 ? 1.12 : 0.89), 0.26, 0.9));
    });
    this.input.on('pointerdown', pointer => { this.panPointer = pointer.rightButtonDown() ? { x: pointer.x, y: pointer.y } : null; });
    this.input.on('pointermove', pointer => {
      if (!this.panPointer || !pointer.isDown) return;
      camera.scrollX -= (pointer.x - this.panPointer.x) / camera.zoom;
      camera.scrollY -= (pointer.y - this.panPointer.y) / camera.zoom;
      this.panPointer = { x: pointer.x, y: pointer.y };
    });
    this.input.on('pointerup', () => { this.panPointer = null; });
    this.input.mouse.disableContextMenu();
    this.labelsVisible = true;
    this.input.keyboard.on('keydown-L', () => { this.labelsVisible = !this.labelsVisible; this.updatePoiLabels(); });
    this.input.keyboard.on('keydown-C', () => this.debug.setVisible(!this.debug.visible));
    this.input.keyboard.on('keydown-R', () => this.focusView('1'));
    this.input.keyboard.on('keydown-F', () => { this.followPlayer = !this.followPlayer; if (this.followPlayer) camera.startFollow(this.player, true, 0.08, 0.08); else camera.stopFollow(); });
    this.currentView = 'mapa';
    for (const [event, key] of [['ZERO', '0'], ['ONE', '1'], ['TWO', '2'], ['THREE', '3'], ['FOUR', '4'], ['FIVE', '5'], ['SIX', '6'], ['SEVEN', '7'], ['EIGHT', '8'], ['NINE', '9']]) this.input.keyboard.on(`keydown-${event}`, () => this.focusView(key));
    this.input.keyboard.on('keydown-P', () => this.downloadScreenshot());
  }

  createHud() {
    const overlay = document.createElement('div'); overlay.className = 'game-hud'; overlay.textContent = 'DOMINÓ ISLAND  ·  BARRIO LOS ROBLES\nWASD / FLECHAS: MOVER  ·  RUEDA: ZOOM  ·  CLIC DERECHO: DESPLAZAR\n0 RESIDENCIAL  ·  1 MAPA  ·  2 COLMADO  ·  3 PARQUE  ·  4 COMERCIOS  ·  5 PERSONAJE  ·  L ETIQUETAS  ·  C COLISIONES  ·  P CAPTURA';
    const toolbar = document.createElement('nav'); toolbar.className = 'game-toolbar'; toolbar.setAttribute('aria-label', 'Vistas del barrio');
    const views = [['0', 'Residencial'], ['1', 'Mapa'], ['2', 'Colmado'], ['3', 'Parque'], ['4', 'Comercios'], ['5', 'Personaje'], ['6', 'Camila'], ['7', 'Moda'], ['8', 'Unión'], ['9', 'Guaguas'], ['P', 'Captura']];
    for (const [key, label] of views) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', () => key === 'P' ? this.downloadScreenshot() : this.focusView(key)); toolbar.append(button); }
    const hint = document.createElement('button'); hint.type = 'button'; hint.className = 'game-prompt'; hint.hidden = true;
    hint.addEventListener('click', () => { if (!hint.hidden) this.enterCurrentInteraction(); });
    document.querySelector('#game').append(overlay, toolbar, hint); this.hudElement = overlay; this.promptElement = hint;
    this.events.once('shutdown', () => { overlay.remove(); toolbar.remove(); hint.remove(); });
  }

  focusView(key) {
    const camera = this.cameras.main;
    if (key === '1') { this.followPlayer = false; this.currentView = 'mapa'; camera.stopFollow(); camera.setZoom(0.29); camera.centerOn(256, 1024); this.updatePoiLabels(); }
    if (key === '4') { this.followPlayer = false; this.currentView = 'comercios'; camera.stopFollow(); camera.setZoom(0.5); const p = this.iso.toScreen(PARK.center.x, PARK.center.y); camera.centerOn(p.x, p.y); }
    if (key === '5') { this.followPlayer = true; this.currentView = 'protagonista'; camera.setZoom(0.76); camera.startFollow(this.player, true, 0.12, 0.12); this.updatePoiLabels(); }
    const view = VIEWS[key]; if (view) this.focusSite(...view);
  }

  focusSite(id, zoom, viewName) {
    const target = id === 'park' ? PARK.center : this.world.buildings.find(b => b.id === id)?.center;
    if (!target) return;
    this.followPlayer = false; this.currentView = viewName; this.cameras.main.stopFollow(); this.cameras.main.setZoom(zoom);
    const p = this.iso.toScreen(target.x, target.y); this.cameras.main.centerOn(p.x, p.y);
    this.updatePoiLabels();
  }

  updatePoiLabels() {
    if (!this.poiLabels || !this.player) return;
    for (const { label, point } of this.poiLabels) {
      const close = Phaser.Math.Distance.Between(this.player.x, this.player.y, point.x, point.y) < WORLD.tileWidth * 5;
      label.setVisible(this.labelsVisible && !(this.followPlayer && close));
    }
  }

  downloadScreenshot() {
    const filename = `${this.currentView ?? 'mapa'}.png`;
    this.game.renderer.snapshot(image => {
      const base64 = image.src.split(',')[1], binary = atob(base64), bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      fetch(`/__save-screenshot?name=${encodeURIComponent(filename.replace(/\.png$/, ''))}`, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: bytes })
        .then(response => { if (!response.ok) throw new Error('No se pudo guardar la captura'); this.hudElement.dataset.status = `Guardado: screenshots/${filename}`; setTimeout(() => delete this.hudElement.dataset.status, 2500); })
        .catch(error => console.error(error));
    });
  }

  // ---- movement ---------------------------------------------------------------------------------------------------
  update(_time, delta) {
    if (!this.player?.active) return;
    const key = this.keys; let vx = 0, vy = 0;
    if (key.A.isDown || key.LEFT.isDown) vx--;
    if (key.D.isDown || key.RIGHT.isDown) vx++;
    if (key.W.isDown || key.UP.isDown) vy--;
    if (key.S.isDown || key.DOWN.isDown) vy++;
    const mag = Math.hypot(vx, vy); if (mag) { vx /= mag; vy /= mag; }
    const distance = this.player.speed * (delta ?? 16) / 1000;
    let moved = false, shownVx = 0, shownVy = 0;
    if (mag) {
      // Keys steer on screen axes; resolve the step in tile space so walls (tile-aligned) are slid along correctly.
      const sx = vx * distance, sy = vy * distance;
      const res = moveInTiles(this.world.colliders, this.tile.x, this.tile.y, sx / WORLD.tileWidth + sy / WORLD.tileHeight, sy / WORLD.tileHeight - sx / WORLD.tileWidth, PLAYER_RADIUS);
      if (res.moved) {
        const before = this.iso.toScreen(this.tile.x, this.tile.y), after = this.iso.toScreen(res.tx, res.ty);
        shownVx = after.x - before.x; shownVy = after.y - before.y;
        this.tile.x = res.tx; this.tile.y = res.ty; moved = true;
      }
    }
    const at = this.iso.toScreen(this.tile.x, this.tile.y);
    this.player.setPosition(at.x, at.y);
    this.player.updateSprite(shownVx, shownVy, moved, this.time.now);
    this.player.setDepth(this.world.sorter.actorDepth(this.tile.x, this.tile.y));
    this.updateInteraction();
    this.updatePoiLabels();
  }

  updateInteraction() {
    this.activeInteraction = this.world.interactions.find(i => i.scene && inRect(i.rect, this.tile.x, this.tile.y)) ?? null;
    const near = !!this.activeInteraction;
    this.promptElement.hidden = !near;
    if (near) this.promptElement.textContent = this.activeInteraction.prompt;
    if (near && Phaser.Input.Keyboard.JustDown(this.interactKey)) this.enterCurrentInteraction();
  }

  enterCurrentInteraction() { if (this.activeInteraction?.scene) this.scene.start(this.activeInteraction.scene); }
}
