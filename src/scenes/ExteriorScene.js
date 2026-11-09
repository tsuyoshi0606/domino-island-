import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { IsometricSystem } from '../systems/IsometricSystem.js';
import { COLMADO_TABLES, SITES, STREETS, WORLD } from '../world/losRobles.js';

const COLORS = { grass: [0x76a85e, 0x7ead64, 0x719d59], road: [0x414247, 0x48494e], sidewalk: [0xd8c098, 0xe5cfaa], park: [0x72a65d, 0x7db365], paving: [0xd8b88a, 0xe6c99b] };
const BUILDING_TEXTURE = { camila: 'camila-house-pixel', house: 'house', 'house-player': 'house-player', 'house-b': 'house-b', 'house-c': 'house-c', station: 'station-pixel', fashion: 'fashion-pixel', market: 'market-pixel', colmado: 'colmado-pixel' };

export class ExteriorScene extends Phaser.Scene {
  constructor() { super('ExteriorScene'); }

  preload() {
    const assets = {
      'colmado-pixel': 'colmado-pixel.png', 'house': 'house.svg',
      'house-player': 'house-player.svg', 'house-b': 'house-b.svg', 'house-c': 'house-c.svg',
      'camila-house-pixel': 'camila-house-pixel.png', 'fashion-pixel': 'fashion-pixel.png', 'market-pixel': 'supermarket-pixel.png',
      'station-pixel': 'bus-station-pixel.png', 'palm': 'palm.svg', 'mango-tree': 'mango-tree-pixel.png',
      'car': 'car.svg', 'domino-table': 'domino-table.svg'
    };
    for (const [key, file] of Object.entries(assets)) this.load.image(key, `/assets/prototype/${file}`);
    this.load.spritesheet('protagonist-sheet','/assets/prototype/protagonist-sheet.png',{frameWidth:313,frameHeight:313});
  }

  create() {
    this.cameras.main.setBackgroundColor('#15231d');
    this.iso = new IsometricSystem(WORLD.tileWidth, WORLD.tileHeight, 0, 0);
    this.cameras.main.setBounds(-1824, -32, 4160, 2112);
    this.sites = SITES.map(site => ({ ...site, x: site.x + WORLD.margin, y: site.y + WORLD.margin, door: site.door.map(value => value + WORLD.margin) }));
    this.drawWorldGrid();            // 1–2. complete 72 x 56 terrain grid, with a four-tile margin
    this.drawStreetNetwork();        // 3–4. connected streets, sidewalks and curbs
    this.drawParcelsAndBlocks();     // 5–6. lots, park and clear access paths
    this.placeBuildings();           // 7. buildings stay inside their parcels
    this.placeParkDetails();         // 8–10. park props, vegetation and vehicles
    this.drawWorldBoundary();
    const spawn = this.tileCenter(33 + WORLD.margin, 43 + WORLD.margin);
    this.player = new Player(this, spawn.x, spawn.y);
    this.player.setDepth(this.player.y + 5);
    this.setupCameraAndControls();
    this.createHud();
  }

  drawWorldGrid() {
    const g = this.add.graphics().setDepth(-1000);
    this.roadCells = new Set(); this.sidewalkCells = new Set(); this.siteCells = new Map();
    for (const street of STREETS) this.registerStreet(street);
    for (const site of this.sites) {
      for (let x = site.x; x < site.x + site.width; x++) for (let y = site.y; y < site.y + site.depth; y++) this.siteCells.set(`${x},${y}`, site);
    }
    for (let y = 0; y < WORLD.rows; y++) for (let x = 0; x < WORLD.columns; x++) {
      const p = this.iso.toScreen(x, y); const site = this.siteCells.get(`${x},${y}`);
      let kind = this.roadCells.has(`${x},${y}`) ? 'road' : this.sidewalkCells.has(`${x},${y}`) ? 'sidewalk' : this.tileKind(site, x, y);
      const palette = COLORS[kind] ?? COLORS.grass;
      const seed = (x * 17 + y * 31 + x * y) >>> 0;
      const fill = palette[seed % palette.length];
      this.paintDiamond(g, p.x, p.y, fill, this.tileEdge(kind), 1);
      if (kind === 'road' && (x + y) % 7 === 0) this.paintRoadDash(g, p.x, p.y, (x & 1) === 0);
    }
  }

  registerStreet(street) {
    for (let n = street.from; n < street.to; n++) for (let lane = 0; lane < street.width; lane++) {
      const x = street.kind === 'horizontal' ? n : street.start + lane;
      const y = street.kind === 'horizontal' ? street.start + lane : n;
      this.roadCells.add(`${x},${y}`);
    }
    for (let n = street.from; n < street.to; n++) for (const edge of [-1, street.width]) {
      const x = street.kind === 'horizontal' ? n : street.start + edge;
      const y = street.kind === 'horizontal' ? street.start + edge : n;
      if (x >= 0 && x < WORLD.columns && y >= 0 && y < WORLD.rows && !this.roadCells.has(`${x},${y}`)) this.sidewalkCells.add(`${x},${y}`);
    }
  }

  tileKind(site, x, y) {
    if (!site) return 'grass';
    if (site.type === 'park') {
      const dx = x - site.x, dy = y - site.y;
      if (dx === 0 || dy === 0 || dx === site.width - 1 || dy === site.depth - 1) return 'sidewalk';
      if (Math.abs(dx - site.width / 2) < 1 || Math.abs(dy - site.depth / 2) < 1) return 'paving';
      return 'park';
    }
    if (['colmado', 'fashion', 'market', 'station'].includes(site.type)) return 'paving';
    // Residential lots keep a landscaped yard; the last two rows become a front walk.
    return y >= site.y + site.depth - 2 ? 'paving' : 'grass';
  }

  tileEdge(kind) {
    if (kind === 'road') return 0x393a3e;
    if (kind === 'sidewalk') return 0xc0a77d;
    if (kind === 'paving') return 0xc4a77b;
    if (kind === 'park') return 0x638b4e;
    return 0x658b51;
  }

  drawStreetNetwork() {
    const g = this.add.graphics().setDepth(-900);
    // Raised curb seams, discrete centre lines and crossings at the street junctions.
    g.lineStyle(3, 0xe9b52f, 0.98);
    for (const street of STREETS) {
      if (street.kind === 'horizontal') {
        for (let x = street.from; x < street.to; x += 2) {
          const p = this.iso.toScreen(x + 0.5, street.start + street.width / 2);
          g.lineBetween(p.x - 11, p.y, p.x + 11, p.y);
        }
      }
      if (street.id === 'A' || street.id === 'C' || street.id === 'E') {
        this.drawCrosswalk(g, street.kind, street.start, 26 + WORLD.margin);
        this.drawCrosswalk(g, street.kind, street.start, 45 + WORLD.margin);
      }
    }
    // Street lamps and storm drains are placed on sidewalks, at repeatable grid anchors.
    for (const [x, y] of [[12, 13], [24, 18], [47, 18], [60, 29], [28, 33], [52, 33], [12, 44], [63, 48]]) {
      const p = this.tileCenter(x + WORLD.margin, y + WORLD.margin); this.drawStreetLamp(p.x, p.y, 34);
    }
    for (const [x, y] of [[20, 17], [42, 33], [61, 48], [64, 22]]) { const p=this.tileCenter(x,y); this.drawDrain(p.x,p.y); }
  }

  drawParcelsAndBlocks() {
    const g = this.add.graphics().setDepth(-700);
    for (const site of this.sites) {
      const corners = [this.iso.toScreen(site.x, site.y), this.iso.toScreen(site.x + site.width, site.y), this.iso.toScreen(site.x + site.width, site.y + site.depth), this.iso.toScreen(site.x, site.y + site.depth)];
      const outline = [...corners, corners[0]];
      g.lineStyle(site.type === 'park' ? 5 : 3, site.type === 'park' ? 0xdcae32 : 0xb08c5b, 0.95);
      g.strokePoints(outline, false);
      this.drawWalkway(g, site);
    }
    // Low block boundaries define a regular urban plan without cutting any doorway.
    for (const street of STREETS) if (street.kind === 'horizontal') this.drawCurbTicks(g, 'horizontal', street);
  }

  drawWalkway(g, site) {
    const [doorX, doorY] = site.door; const door = this.iso.toScreen(doorX + 0.5, doorY + 0.5);
    const before = this.iso.toScreen(doorX + 0.5, doorY - 1.5);
    g.lineStyle(7, 0xe6ca9b, 1); g.lineBetween(before.x, before.y, door.x, door.y);
    g.lineStyle(2, 0xf7e4bd, 0.85); g.lineBetween(before.x, before.y, door.x, door.y);
    if (site.id === 'colmado') {
      const front = this.iso.toScreen(doorX + 0.5, site.y + site.depth + 0.5);
      g.lineStyle(12, 0xe6ca9b, 1); g.lineBetween(door.x, door.y, front.x, front.y);
      g.lineStyle(2, 0xf7e4bd, 0.85); g.lineBetween(door.x, door.y, front.x, front.y);
    }
    if (site.type === 'park') return;
    // Fences are broken at the entrance and use measured parcel edges.
    const c = [this.iso.toScreen(site.x, site.y + site.depth), this.iso.toScreen(site.x + site.width, site.y + site.depth)];
    g.lineStyle(3, 0x2d3030, 0.95);
    const doorPos = this.iso.toScreen(doorX + 0.5, site.y + site.depth);
    g.lineBetween(c[0].x, c[0].y, doorPos.x - 30, doorPos.y);
    g.lineBetween(doorPos.x + 30, doorPos.y, c[1].x, c[1].y);
    for (let t = 0; t <= 1.001; t += 0.1) {
      const x = Phaser.Math.Linear(c[0].x, c[1].x, t), y = Phaser.Math.Linear(c[0].y, c[1].y, t);
      if (Math.abs(x - doorPos.x) < 34) continue;
      g.lineBetween(x, y - 4, x, y + 7);
    }
  }

  drawCurbTicks(g, _axis, street) {
    const y = street.start + street.width; g.lineStyle(2, 0xedd18c, 0.7);
    for (let x = street.from; x < street.to; x += 1) {
      const p = this.iso.toScreen(x, y); g.lineBetween(p.x - 31, p.y + 15, p.x + 31, p.y + 15);
    }
  }

  drawWorldBoundary() {
    const g = this.add.graphics().setDepth(100000);
    const corners = [this.iso.toScreen(0, 0), this.iso.toScreen(WORLD.columns, 0), this.iso.toScreen(WORLD.columns, WORLD.rows), this.iso.toScreen(0, WORLD.rows)];
    const closed = [...corners, corners[0]];
    // A continuous raised curb and down-facing shadow make the expanded map edge intentional.
    g.lineStyle(18, 0x26352a, 1);
    for (let i = 0; i < corners.length; i++) {
      const a = corners[i], b = corners[(i + 1) % corners.length];
      g.lineBetween(a.x, a.y + 12, b.x, b.y + 12);
    }
    g.lineStyle(13, 0x846742, 1); g.strokePoints(closed, false);
    g.lineStyle(7, 0xe0b955, 1); g.strokePoints(closed, false);
    g.lineStyle(2, 0xffe0a0, 0.95); g.strokePoints(closed, false);
  }

  placeBuildings() {
    this.siteDoors = [];
    this.poiLabels = [];
    for (const site of this.sites) {
      if (site.type === 'park') continue;
      // Use the beige concrete-home artwork for the protagonist's house instead of the old blue placeholder.
      const asset = site.id === 'home-player' ? 'house' : site.id === 'home-b' ? 'house-b' : site.id === 'home-c' ? 'house-c' : BUILDING_TEXTURE[site.type];
      const frontPad = site.type === 'colmado' ? 3 : 0;
      const foot = this.iso.toScreen(site.x + site.width / 2, site.y + site.depth - frontPad);
      const pixelScale = { camila: 0.32, fashion: 0.34, market: 0.35, station: 0.34, colmado: 0.58 };
      const scale = pixelScale[site.type] ?? site.scale;
      const building = this.add.image(foot.x, foot.y, asset).setOrigin(0.5, 1).setScale(scale).setDepth(foot.y - 2);
      if (site.tint && !['home-player','home-b','home-c'].includes(site.id)) building.setTint(site.tint);
      building.setData('siteId', site.id);
      if (site.type === 'colmado') {
        // The generated pixel sprite keeps its fascia clean; precise, crisp project lettering sits over it.
        this.add.text(foot.x - 12, foot.y - 357, 'Colmado\nDon Ramón', {
          fontFamily: 'Arial, sans-serif', fontSize: '42px', fontStyle: 'bold', align: 'center', lineSpacing: -7,
          color: '#fff4d8', stroke: '#78312a', strokeThickness: 5
        }).setOrigin(0.5).setDepth(foot.y - 2 + 1);
      }
      const sign = {
        fashion: { x: 32, y: -243, text: 'Moda Urbana', size: 34, lines: false },
        market: { x: -48, y: -208, text: 'Supermercado\nLa Unión', size: 30, lines: true }
      }[site.type];
      if (sign) this.add.text(foot.x + sign.x, foot.y + sign.y, sign.text, {
        fontFamily: 'Arial, sans-serif', fontSize: `${sign.size}px`, fontStyle: 'bold', align: 'center',
        lineSpacing: -5, color: '#fff4d8', stroke: site.type === 'fashion' ? '#233b88' : '#8f2926', strokeThickness: 4
      }).setOrigin(0.5).setDepth(foot.y - 1);
      this.siteDoors.push({ ...site, point: this.tileCenter(site.door[0], site.door[1]) });
      // Facade lettering identifies these stores; only unbranded POIs get an extra tag.
      if (!['colmado', 'fashion', 'market'].includes(site.type)) {
        const labelPoint = this.iso.toScreen(site.x + site.width / 2, site.y + 1);
        const label = this.add.text(labelPoint.x, labelPoint.y - 18, site.name, { fontFamily: 'monospace', fontSize: '23px', fontStyle: 'bold', color: '#fff0ce', stroke: '#242320', strokeThickness: 5, backgroundColor: '#29251f', padding: { x: 7, y: 4 } }).setOrigin(0.5).setDepth(foot.y + 15);
        label.setData('poi', true); this.poiLabels.push({ label, point: this.tileCenter(site.x + site.width / 2, site.y + 1) });
      }
    }
    // The domino tables remain on paved colmado tiles, flanking the clear entrance.
    const tables = COLMADO_TABLES.map(table => [table.x + WORLD.margin, table.y + WORLD.margin, table.name]);
    for (const [x, y, title] of tables) {
      const p = this.tileCenter(x, y);
      const table = this.add.image(p.x, p.y, 'domino-table').setScale(0.85).setDepth(p.y + 2);
      table.setData('table', title);
      this.add.text(p.x, p.y + 92, title === 'HISTORIA' ? 'DOMINÓ HISTORIA\n(OFFLINE)' : 'DOMINÓ ONLINE\n(MULTIJUGADOR)', { fontFamily: 'monospace', fontSize: '18px', align: 'center', color: '#fff1d4', stroke: '#38281d', strokeThickness: 4, backgroundColor: '#50351f', padding: { x: 5, y: 3 } }).setOrigin(0.5).setDepth(p.y + 8);
    }
  }

  placeParkDetails() {
    const site = this.sites.find(s => s.type === 'park');
    const center = this.tileCenter(site.x + 8, site.y + 6.5);
    const garden = this.add.graphics().setDepth(center.y - 2);
    garden.fillStyle(0x4f7d40, 0.96); garden.fillEllipse(center.x, center.y - 8, 270, 94);
    this.add.image(center.x, center.y + 2, 'mango-tree').setOrigin(0.5, 0.97).setScale(0.36).setDepth(center.y + 1);
    // Four paved walkways and planter beds keep entrances open from every side.
    this.drawParkWalk(center.x, center.y, 'x'); this.drawParkWalk(center.x, center.y, 'y');
    for (const [dx, dy] of [[-190,-57],[190,-57],[-190,70],[190,70]]) this.drawParkBench(center.x + dx, center.y + dy);
    for (const [dx, dy] of [[-218,-95],[218,-95],[-218,26],[218,26]]) this.drawStreetLamp(center.x + dx, center.y + dy, 53);
    for (const [dx, dy] of [[-200,-19],[200,-19],[-110,86],[110,86],[-85,-100],[85,-100]]) this.drawFlowerBed(center.x + dx, center.y + dy);
    const tables = [this.tileCenter(site.x + 4, site.y + 9), this.tileCenter(site.x + 12, site.y + 9)];
    for (const gameTable of tables) this.add.image(gameTable.x, gameTable.y, 'domino-table').setScale(0.68).setDepth(gameTable.y + 2);
    this.add.text(center.x, center.y + 118, 'PARQUE LOS ROBLES', { fontFamily: 'monospace', fontSize: '23px', color: '#fff0cc', stroke: '#263426', strokeThickness: 5, backgroundColor: '#315d38', padding: { x: 6, y: 3 } }).setOrigin(0.5).setDepth(center.y + 5);
    // Tropical trees in selected front yards and street corners.
    for (const [x, y, scale] of [[12,9,.78],[44,9,.75],[8,19,.7],[58,19,.7],[11,35,.76],[54,36,.75],[10,41,.78],[54,41,.74]]) {
      const p = this.tileCenter(x + WORLD.margin, y + WORLD.margin); this.add.image(p.x, p.y, 'palm').setOrigin(0.5, 0.91).setScale(scale).setDepth(p.y + 1);
    }
    for (const [x, y] of [[6,8],[25,12],[47,8],[10,35],[55,27],[18,42],[41,42],[59,42]]) { const p=this.tileCenter(x + WORLD.margin,y + WORLD.margin); this.drawBougainvillea(p.x,p.y); }
    // Vehicles sit within the asphalt and align to the logical street directions.
    for (const [x, y, key, scale, angle] of [[9,16,'car',.9,-27],[51,16,'car',.88,27],[44,34,'car',.92,-27],[15,46,'car',.86,27]]) {
      const p=this.tileCenter(x + WORLD.margin,y + WORLD.margin);this.add.image(p.x,p.y,key).setScale(scale).setRotation(Phaser.Math.DegToRad(angle)).setDepth(p.y + 3);
    }
  }

  drawParkWalk(x, y, axis) {
    const g = this.add.graphics().setDepth(y - 12);
    const line = axis === 'x' ? [[x - 205, y - 102], [x + 205, y + 102]] : [[x - 205, y + 102], [x + 205, y - 102]];
    g.lineStyle(30, 0xbfa477, 0.95); g.lineBetween(line[0][0], line[0][1], line[1][0], line[1][1]);
    g.lineStyle(23, 0xe4ceaa, 1); g.lineBetween(line[0][0], line[0][1], line[1][0], line[1][1]);
  }

  setupCameraAndControls() {
    const camera = this.cameras.main;
    camera.setZoom(0.29); camera.centerOn(256, 1024);
    this.followPlayer = false;
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,R,F,L,ZERO,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,NINE,P');
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
    this.input.keyboard.on('keydown-R', () => { this.followPlayer = false;this.currentView='mapa';camera.stopFollow();camera.setZoom(0.29);camera.centerOn(256,1024);this.updatePoiLabels(); });
    this.input.keyboard.on('keydown-F', () => { this.followPlayer = !this.followPlayer; if (this.followPlayer) camera.startFollow(this.player, true, 0.08, 0.08); else camera.stopFollow(); });
    this.currentView='mapa';
    for(const [event,key] of [['ZERO','0'],['ONE','1'],['TWO','2'],['THREE','3'],['FOUR','4'],['FIVE','5'],['SIX','6'],['SEVEN','7'],['EIGHT','8'],['NINE','9']])this.input.keyboard.on(`keydown-${event}`,()=>this.focusView(key));
    this.input.keyboard.on('keydown-P', () => this.downloadScreenshot());
  }

  createHud() {
    const overlay=document.createElement('div');overlay.className='game-hud';overlay.textContent='DOMINÓ ISLAND  ·  BARRIO LOS ROBLES\nWASD / FLECHAS: MOVER  ·  RUEDA: ZOOM  ·  CLIC DERECHO: DESPLAZAR\n0 RESIDENCIAL  ·  1 MAPA  ·  2 COLMADO  ·  3 PARQUE  ·  4 COMERCIOS  ·  5 PERSONAJE  ·  L ETIQUETAS  ·  P CAPTURA';
    const toolbar=document.createElement('nav');toolbar.className='game-toolbar';toolbar.setAttribute('aria-label','Vistas del barrio');
    const views=[['0','Residencial'],['1','Mapa'],['2','Colmado'],['3','Parque'],['4','Comercios'],['5','Personaje'],['6','Camila'],['7','Moda'],['8','Unión'],['9','Guaguas'],['P','Captura']];
    for(const [key,label] of views){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>key==='P'?this.downloadScreenshot():this.focusView(key));toolbar.append(button);}
    const hint=document.createElement('button');hint.type='button';hint.className='game-prompt';hint.textContent='[E] ENTRAR AL COLMADO DON RAMÓN';hint.hidden=true;
    hint.addEventListener('click',()=>{if(!hint.hidden)this.scene.start('ColmadoInteriorScene');});
    document.querySelector('#game').append(overlay,toolbar,hint);this.hudElement=overlay;this.promptElement=hint;
    this.events.once('shutdown',()=>{overlay.remove();toolbar.remove();hint.remove();});
  }

  focusView(key){
    const camera=this.cameras.main;
    if(key==='1'){this.followPlayer=false;this.currentView='mapa';camera.stopFollow();camera.setZoom(0.29);camera.centerOn(256,1024);this.updatePoiLabels();}
    if(key==='0')this.focusSite('home-player',0.72,'residencial');
    if(key==='2')this.focusSite('colmado',0.7,'colmado');
    if(key==='3')this.focusSite('park',0.72,'parque');
    if(key==='4'){this.followPlayer=false;this.currentView='comercios';camera.stopFollow();camera.setZoom(0.66);const p=this.iso.toScreen(37 + WORLD.margin,24 + WORLD.margin);camera.centerOn(p.x,p.y);}
    if(key==='5'){this.followPlayer=true;this.currentView='protagonista';camera.setZoom(0.76);camera.startFollow(this.player,true,0.12,0.12);this.updatePoiLabels();}
    if(key==='6')this.focusSite('camila',0.62,'camila');
    if(key==='7')this.focusSite('fashion',0.64,'moda');
    if(key==='8')this.focusSite('market',0.62,'supermercado');
    if(key==='9')this.focusSite('station',0.72,'guaguas');
  }

  focusSite(id, zoom, viewName) {
    const site=this.sites.find(item=>item.id===id);if(!site)return;
    this.followPlayer=false;this.currentView=viewName;this.cameras.main.stopFollow();this.cameras.main.setZoom(zoom);
    const p=this.iso.toScreen(site.x+site.width/2,site.y+site.depth/2);this.cameras.main.centerOn(p.x,p.y);
    this.updatePoiLabels();
  }

  updatePoiLabels() {
    if (!this.poiLabels) return;
    for (const { label, point } of this.poiLabels) {
      const close = this.player && Phaser.Math.Distance.Between(this.player.x, this.player.y, point.x, point.y) < WORLD.tileWidth * 5;
      label.setVisible(this.labelsVisible && !(this.followPlayer && close));
    }
  }

  downloadScreenshot() {
    const filename=`${this.currentView??'mapa'}.png`;
    this.game.renderer.snapshot(image=>{
      const base64=image.src.split(',')[1],binary=atob(base64),bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      fetch(`/__save-screenshot?name=${encodeURIComponent(filename.replace(/\.png$/,''))}`,{method:'POST',headers:{'Content-Type':'image/png'},body:bytes})
        .then(response=>{if(!response.ok)throw new Error('No se pudo guardar la captura');this.hudElement.dataset.status=`Guardado: screenshots/${filename}`;setTimeout(()=>delete this.hudElement.dataset.status,2500);})
        .catch(error=>console.error(error));
    });
  }

  update(_time, delta) {
    if (!this.player?.active) return;
    const key=this.keys;let vx=0,vy=0;
    if(key.A.isDown||key.LEFT.isDown)vx--;
    if(key.D.isDown||key.RIGHT.isDown)vx++;
    if(key.W.isDown||key.UP.isDown)vy--;
    if(key.S.isDown||key.DOWN.isDown)vy++;
    const mag=Math.hypot(vx,vy);if(mag){vx/=mag;vy/=mag;}
    const distance=this.player.speed*(delta??16)/1000;
    const nx=this.player.x+vx*distance,ny=this.player.y+vy*distance;
    let movedX=false,movedY=false;
    if(mag&& !this.isBlocked(nx,ny)) { this.player.setPosition(nx,ny);movedX=movedY=true; }
    else if(mag) {
      // Slide along walls when only one screen axis is blocked.
      if(vx&&!this.isBlocked(nx,this.player.y)){this.player.x=nx;movedX=true;}
      if(vy&&!this.isBlocked(this.player.x,ny)){this.player.y=ny;movedY=true;}
    }
    const actualVx=movedX?vx:0,actualVy=movedY?vy:0;
    this.player.updateSprite(actualVx,actualVy,movedX||movedY,this.time.now);
    this.player.setDepth(this.player.y + 4);
    this.updateInteraction();
    this.updatePoiLabels();
  }

  updateInteraction() {
    const colmado = this.siteDoors.find(site => site.id === 'colmado');
    const d = Phaser.Math.Distance.Between(this.player.x,this.player.y,colmado.point.x,colmado.point.y);
    const near = d < WORLD.tileWidth * 1.35;
    this.promptElement.hidden=!near;
    if(near&&Phaser.Input.Keyboard.JustDown(this.interactKey))this.scene.start('ColmadoInteriorScene');
  }

  isBlocked(screenX,screenY) {
    const tile=this.iso.toTile(screenX,screenY),x=Math.floor(tile.x),y=Math.floor(tile.y);
    if(x<0||x>=WORLD.columns||y<0||y>=WORLD.rows)return true;
    for(const site of this.sites){
      if(site.type==='park')continue;
      if(x<site.x+1||x>=site.x+site.width-1||y<site.y+1||y>=site.y+site.depth-2)continue;
      if(Math.abs(x-site.door[0])<=1&&Math.abs(y-site.door[1])<=1)continue;
      return true;
    }
    return false;
  }

  tileCenter(x,y){return this.iso.toScreen(x+0.5,y+0.5);}
  paintDiamond(g,x,y,fill,edge,alpha=1){const points=[{x,y},{x:x+32,y:y+16},{x,y:y+32},{x:x-32,y:y+16}];g.fillStyle(fill,alpha);g.fillPoints(points,true);g.lineStyle(1,edge,0.38);g.strokePoints(points,true);}
  paintRoadDash(g,x,y,horizontal){g.fillStyle(0xe4b62d,0.72);if(horizontal)g.fillRect(x-9,y+14,18,2);else g.fillRect(x-1,y+7,2,18);}
  drawCrosswalk(g,kind,start,at){for(let i=-1;i<=1;i++){const p=kind==='horizontal'?this.tileCenter(at+i,start+2):this.tileCenter(start+1,at+i);g.fillStyle(0xf2e9d6,0.88);g.fillPoints([{x:p.x-11,y:p.y+1},{x:p.x+9,y:p.y+11},{x:p.x+9,y:p.y+15},{x:p.x-11,y:p.y+5}],true);}}
  drawDrain(x,y){const g=this.add.graphics().setDepth(y+2);g.fillStyle(0x494a48,1);g.fillPoints([{x:x-16,y},{x,y:y-8},{x:x+16,y},{x,y:y+8}],true);g.lineStyle(1,0xaaa18e,0.85);for(let i=-2;i<=2;i++)g.lineBetween(x+i*5,y-6,x+i*5,y+6);}
  drawStreetLamp(x,y,height){const g=this.add.graphics().setDepth(y+10);g.fillStyle(0x242729,1);g.fillRect(x-3,y-height,6,height);g.fillRect(x-9,y-height-7,18,4);g.fillStyle(0xffdc77,1);g.fillCircle(x,y-height-9,8);g.fillStyle(0xfff2c0,0.75);g.fillCircle(x-2,y-height-11,3);}
  drawBougainvillea(x,y){const g=this.add.graphics().setDepth(y+2);g.fillStyle(0x386a3b,1);g.fillEllipse(x,y+5,53,18);for(let i=0;i<9;i++){const px=x-20+(i%5)*10,py=y-5+Math.floor(i/5)*12;g.fillStyle(i%3?0xe95787:0xf0c547,1);g.fillCircle(px,py,5);g.fillStyle(0xffedbf,1);g.fillCircle(px,py,1.5);}}
  drawFlowerBed(x,y){const g=this.add.graphics().setDepth(y+2);g.fillStyle(0x966d46,1);g.fillPoints([{x:x-47,y:y+5},{x,y:y+19},{x:x+47,y:y+5},{x,y:y-9}],true);g.fillStyle(0x277b42,1);g.fillPoints([{x:x-41,y:y},{x,y:y+12},{x:x+41,y:y},{x,y:y-12}],true);for(let i=0;i<7;i++){g.fillStyle(i%2?0xe84c81:0xefbc37,1);g.fillCircle(x-28+i*9,y-3+(i%2)*6,4);}}
  drawParkBench(x,y){const g=this.add.graphics().setDepth(y+3);g.fillStyle(0x302a25,0.4);g.fillEllipse(x,y+14,66,13);g.fillStyle(0x88562d,1);g.fillRect(x-27,y-8,54,7);g.fillRect(x-27,y-17,54,6);g.fillRect(x-25,y-1,50,4);g.fillStyle(0x403129,1);g.fillRect(x-20,y+2,4,14);g.fillRect(x+16,y+2,4,14);}
}
