import Phaser from 'phaser';

// Temporary but reusable 2D shop layout. Visual reference: user's Colmado guide.
export class ColmadoInteriorScene extends Phaser.Scene {
  constructor() { super('ColmadoInteriorScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#171b19');
    const g = this.add.graphics();
    const left = 180, top = 86, width = 920, height = 520;
    // Warm ceramic floor, clear walkable center and thick brick perimeter.
    g.fillStyle(0x8b332b, 1); g.fillRect(left - 24, top - 24, width + 48, height + 48);
    g.fillStyle(0x44302a, 1); g.fillRect(left - 13, top - 13, width + 26, height + 26);
    g.fillStyle(0xdba94e, 1); g.fillRect(left, top, width, height);
    for (let y = top; y < top + height; y += 32) for (let x = left; x < left + width; x += 32) {
      g.fillStyle(((x-left)/32 + (y-top)/32) % 2 ? 0xe9c27b : 0xe2b86f, 1);
      g.fillRect(x + 1, y + 1, 30, 30); g.lineStyle(1, 0xb98e55, 0.35); g.strokeRect(x + 1, y + 1, 30, 30);
    }
    // Back wall beverage coolers, shelves and television.
    this.add.text(640, 35, 'COLMADO DON RAMÓN  ·  INTERIOR', { fontFamily: 'monospace', fontSize: '19px', color: '#fff0ce' }).setOrigin(0.5);
    for (let i = 0; i < 4; i++) this.drawCooler(g, left + 45 + i * 115, top + 24);
    this.drawShelf(g, 750, top + 24, 250, 110);
    g.fillStyle(0x26252a, 1); g.fillRoundedRect(1000, top + 22, 78, 56, 4);
    g.fillStyle(0x73aab1, 1); g.fillRect(1006, top + 28, 66, 42); this.add.text(1039, top + 79, 'TV', {fontFamily:'monospace',fontSize:'10px',color:'#fff'}).setOrigin(0.5);
    // Side aisles and produce crates.
    this.drawShelf(g, left + 12, 235, 54, 250); this.drawShelf(g, 1034, 235, 54, 250);
    this.drawCrate(g, 245, 515, 0xc5332d); this.drawCrate(g, 300, 515, 0x2467a3); this.drawCrate(g, 1002, 515, 0xe7a626);
    // Don Ramón behind the long wooden counter with register.
    g.fillStyle(0x75401f, 1); g.fillRoundedRect(690, 225, 345, 92, 5);
    g.fillStyle(0xb47431, 1); g.fillRect(690, 221, 345, 18); g.lineStyle(2, 0x56351f, 1); g.strokeRect(690, 225, 345, 92);
    g.fillStyle(0x272728, 1); g.fillRect(932, 190, 55, 31); g.fillStyle(0x72b4c2, 1); g.fillRect(938, 195, 43, 18);
    this.drawNpc(790, 200);
    this.add.text(790, 177, 'Don Ramón', {fontFamily:'monospace',fontSize:'13px',color:'#fff2cf',backgroundColor:'#573425',padding:{x:5,y:3}}).setOrigin(0.5);
    // Four chairs around each domino table plus a small round café table.
    this.drawDominoTable(g, 430, 385, 'HISTORIA'); this.drawDominoTable(g, 720, 385, 'ONLINE');
    this.drawChair(g, 385, 347, 0xece7d9); this.drawChair(g, 475, 347, 0xece7d9); this.drawChair(g, 385, 431, 0xece7d9); this.drawChair(g, 475, 431, 0xece7d9);
    this.drawChair(g, 675, 347, 0xcf3936); this.drawChair(g, 765, 347, 0xcf3936); this.drawChair(g, 675, 431, 0xcf3936); this.drawChair(g, 765, 431, 0xcf3936);
    g.fillStyle(0xa92c29, 1); g.fillCircle(930, 415, 42); g.lineStyle(4, 0x5d321f, 1); g.strokeCircle(930, 415, 42); g.fillRect(925, 455, 10, 34);
    this.add.text(930, 471, 'MESA DE CAFÉ', {fontFamily:'monospace',fontSize:'10px',color:'#54321e'}).setOrigin(0.5);
    // Walkable entry threshold at the bottom, with potted palms on either side.
    g.fillStyle(0x276b9d, 1); g.fillRect(565, 586, 150, 27); g.fillStyle(0xd6b182, 1); g.fillRect(578, 590, 124, 18);
    this.drawPlant(g, 530, 582); this.drawPlant(g, 750, 582);
    this.add.text(640, 640, 'E / ESC  ·  SALIR AL BARRIO', {fontFamily:'monospace',fontSize:'14px',color:'#fff2d0',backgroundColor:'#8b352b',padding:{x:10,y:6}}).setOrigin(0.5);
    this.add.text(640, 680, 'WASD / FLECHAS: CAMINAR  ·  MOSTRADOR Y ESTANTERÍAS DEL COLMADO', {fontFamily:'monospace',fontSize:'10px',color:'#dfcfaa'}).setOrigin(0.5);
    this.exitButton=document.createElement('button');this.exitButton.type='button';this.exitButton.className='game-prompt';this.exitButton.textContent='[E / ESC] SALIR AL BARRIO';this.exitButton.hidden=true;
    this.exitButton.addEventListener('click',()=>{if(this.player?.y>500)this.scene.start('ExteriorScene',{from:'colmado'});});document.querySelector('#game').append(this.exitButton);
    this.events.once('shutdown',()=>this.exitButton.remove());
    this.player = this.add.container(640, 548); this.drawPlayer(this.player);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ESC,E');
    this.input.keyboard.on('keydown', this.handleExitKey, this);
    this.prompt = this.add.text(640, 510, '[E] SALIR', {fontFamily:'monospace',fontSize:'13px',color:'#fff',backgroundColor:'#8b352b',padding:{x:7,y:5}}).setOrigin(0.5);
    this.events.on('update', this.updateInterior, this);
    this.events.once('shutdown', () => this.events.off('update', this.updateInterior, this));
  }
  drawCooler(g,x,y){g.fillStyle(0x155c91,1);g.fillRoundedRect(x,y,96,116,4);g.fillStyle(0x9cd1d6,1);g.fillRect(x+7,y+8,82,100);g.fillStyle(0x1e5277,1);g.fillRect(x+49,y+8,3,100);for(let r=0;r<4;r++){g.fillStyle(0xe4a736,1);g.fillRect(x+10,y+23+r*20,76,3);for(let c=0;c<5;c++){g.fillStyle([0xd93d2d,0xe6b331,0x42965a,0x4b8bb6][(c+r)%4],1);g.fillRect(x+13+c*14,y+10+r*20,8,11);}}}
  drawShelf(g,x,y,w,h){g.fillStyle(0x5b341e,1);g.fillRect(x,y,w,h);for(let r=0;r<5;r++){g.fillStyle(0x9b612e,1);g.fillRect(x,y+r*(h/5)+15,w,7);for(let c=0;c<Math.max(2,Math.floor(w/20));c++){g.fillStyle([0xd83b2e,0xe9b53b,0x45904a,0x477ca7][(r+c)%4],1);g.fillRect(x+5+c*18,y+2+r*(h/5),11,13);}}}
  drawCrate(g,x,y,color){g.fillStyle(color,1);g.fillRect(x,y,42,34);g.lineStyle(3,0x513520,1);g.strokeRect(x,y,42,34);for(let i=1;i<4;i++)g.lineBetween(x+i*10,y,x+i*10,y+34);}
  drawDominoTable(g,x,y,label){g.fillStyle(0x56331f,1);g.fillRoundedRect(x-49,y-30,98,60,5);g.fillStyle(label==='ONLINE'?0xb43230:0x70451f,1);g.fillRoundedRect(x-44,y-25,88,50,4);g.lineStyle(2,0xe7ca91,1);g.strokeRoundedRect(x-44,y-25,88,50,4);for(let i=0;i<4;i++){g.fillStyle(0xf5e8cf,1);g.fillRoundedRect(x-20+i*12,y-8,10,17,2);g.fillStyle(0x33281f,1);g.fillCircle(x-15+i*12,y-4,1.5);g.fillCircle(x-15+i*12,y+4,1.5);}this.add.text(x,y+34,`DOMINÓ ${label}`,{fontFamily:'monospace',fontSize:'10px',color:'#4c301e'}).setOrigin(0.5);}
  drawChair(g,x,y,color){g.fillStyle(0x58432f,1);g.fillRoundedRect(x-16,y-12,32,27,4);g.fillStyle(color,1);g.fillRoundedRect(x-14,y-10,28,22,4);g.lineStyle(2,color,1);g.strokeRoundedRect(x-14,y-10,28,22,4);}
  drawPlant(g,x,y){const pot=this.add.graphics();pot.fillStyle(0xb56c36,1);pot.fillPoints([{x:x-16,y:y-9},{x:x+16,y:y-9},{x:x+11,y:y+8},{x:x-11,y:y+8}],true);pot.fillStyle(0x278046,1);pot.fillCircle(x,y-19,13);pot.fillCircle(x-10,y-13,8);pot.fillCircle(x+10,y-13,8);}
  drawNpc(x,y){const n=this.add.graphics();n.fillStyle(0x36302a,1);n.fillRect(x-11,y-20,22,40);n.fillStyle(0xd99d70,1);n.fillCircle(x,y-29,12);n.fillStyle(0xe8d2a8,1);n.fillEllipse(x,y-39,26,7);n.fillRect(x-10,y-46,20,7);n.fillStyle(0x272321,1);n.fillRect(x-4,y-30,3,3);n.fillRect(x+3,y-30,3,3);}
  drawPlayer(c){const g=this.add.graphics();g.fillStyle(0x26372d,0.4);g.fillEllipse(0,13,20,7);g.fillStyle(0x29262b,1);g.fillRect(-7,2,6,13);g.fillRect(1,2,6,13);g.fillStyle(0x2768ab,1);g.fillRect(-9,-12,18,17);g.fillStyle(0xe2ae81,1);g.fillRect(-7,-26,14,14);g.fillStyle(0x30241e,1);g.fillRect(-8,-29,16,5);g.fillStyle(0x171b1c,1);g.fillRect(-7,-23,5,3);g.fillRect(2,-23,5,3);}
  handleExitKey(event){if((event.code==='KeyE'||event.code==='Escape')&&this.player.y>500)this.scene.start('ExteriorScene',{from:'colmado'});}
  updateInterior(){const k=this.keys;let dx=0,dy=0;if(k.A.isDown||k.LEFT.isDown)dx--;if(k.D.isDown||k.RIGHT.isDown)dx++;if(k.W.isDown||k.UP.isDown)dy--;if(k.S.isDown||k.DOWN.isDown)dy++;const speed=3;if(dx&&dy){dx*=0.707;dy*=0.707;}this.player.x=Phaser.Math.Clamp(this.player.x+dx*speed,205,1075);this.player.y=Phaser.Math.Clamp(this.player.y+dy*speed,335,555);this.prompt.setVisible(this.player.y>525);this.exitButton.hidden=this.player.y<=500;if((Phaser.Input.Keyboard.JustDown(k.E)||Phaser.Input.Keyboard.JustDown(k.ESC))&&this.player.y>500)this.scene.start('ExteriorScene',{from:'colmado'});}
}
