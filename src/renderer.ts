import Phaser from 'phaser';
import { game, calcDirection } from './game';
import type { EffectEvent, MonsterEntity, MinionEntity, DropEntity, DamageNumber } from './types';
import { assetUrl } from './utils';

// Map 0-7 direction to 5-direction digit + flipX
export function getDirInfo(dir: number): { dirDigit: number; flipX: boolean } {
  const d = ((dir % 8) + 8) % 8;
  if (d <= 4) {
    return { dirDigit: d, flipX: false };
  } else if (d === 5) {
    return { dirDigit: 3, flipX: true };
  } else if (d === 6) {
    return { dirDigit: 2, flipX: true };
  } else {
    return { dirDigit: 1, flipX: true };
  }
}

const HERO_ATLAS_MAP: Record<string, string> = {
  warrior: 'hero_5110501',
  wizard: 'hero_5120503',
  taoist: 'hero_5130503'
};

const CHAPTER_MAP_IMAGE: Record<string, string> = {
  sunset_island: 'floor_grass',
  central_state: 'floor_stone',
  hot_desert: 'floor_desert'
};

interface ActiveEffectAnim {
  type: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  radius?: number;
  color?: number;
  life: number;
  maxLife: number;
}

export class BattleScene extends Phaser.Scene {
  private bgTile!: Phaser.GameObjects.TileSprite;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Graphics;
  private playerShieldGfx!: Phaser.GameObjects.Graphics;

  private monsterSprites = new Map<number, Phaser.GameObjects.Sprite>();
  private monsterPool: Phaser.GameObjects.Sprite[] = [];

  private minionSprites = new Map<number, Phaser.GameObjects.Sprite>();
  private minionPool: Phaser.GameObjects.Sprite[] = [];

  private fxGraphics!: Phaser.GameObjects.Graphics;
  private uiGraphics!: Phaser.GameObjects.Graphics;

  private activeFxList: ActiveEffectAnim[] = [];

  private damageTexts = new Map<number, Phaser.GameObjects.Text>();
  private damageTextPool: Phaser.GameObjects.Text[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  private currentChapterId = '';
  private currentHeroClass = '';

  constructor() {
    super('BattleScene');
  }

  preload() {
    // 1. Terrain Tiles
    this.load.image('floor_grass', assetUrl('assets/woool/maps/floor_grass.png'));
    this.load.image('floor_stone', assetUrl('assets/woool/maps/floor_stone.png'));
    this.load.image('floor_desert', assetUrl('assets/woool/maps/floor_desert.png'));

    // 2. Heroes
    this.load.atlas('hero_5110501', assetUrl('assets/woool/heroes/r_5110501@0.png'), assetUrl('assets/woool/heroes/r_5110501@0.json'));
    this.load.atlas('hero_5120503', assetUrl('assets/woool/heroes/r_5120503@0.png'), assetUrl('assets/woool/heroes/r_5120503@0.json'));
    this.load.atlas('hero_5130503', assetUrl('assets/woool/heroes/r_5130503@0.png'), assetUrl('assets/woool/heroes/r_5130503@0.json'));

    // 3. Monsters
    this.load.atlas('m_20038', assetUrl('assets/woool/monsters/m_20038@0.png'), assetUrl('assets/woool/monsters/m_20038@0.json'));
    this.load.atlas('m_20046', assetUrl('assets/woool/monsters/m_20046@0.png'), assetUrl('assets/woool/monsters/m_20046@0.json'));
    this.load.atlas('m_20072', assetUrl('assets/woool/monsters/m_20072@0.png'), assetUrl('assets/woool/monsters/m_20072@0.json'));
    this.load.atlas('m_20081', assetUrl('assets/woool/monsters/m_20081@0.png'), assetUrl('assets/woool/monsters/m_20081@0.json'));
    this.load.atlas('m_20082', assetUrl('assets/woool/monsters/m_20082@0.png'), assetUrl('assets/woool/monsters/m_20082@0.json'));
    this.load.atlas('m_20085', assetUrl('assets/woool/monsters/m_20085@0.png'), assetUrl('assets/woool/monsters/m_20085@0.json'));
    this.load.atlas('m_20111', assetUrl('assets/woool/monsters/m_20111@0.png'), assetUrl('assets/woool/monsters/m_20111@0.json'));
    this.load.atlas('m_20112', assetUrl('assets/woool/monsters/m_20112@0.png'), assetUrl('assets/woool/monsters/m_20112@0.json'));

    // 4. Effects
    this.load.atlas('level_up', assetUrl('assets/woool/effects/level_up@0.png'), assetUrl('assets/woool/effects/level_up@0.json'));
  }

  create() {
    this.registerAllAnimations();

    // Map Background
    this.currentChapterId = game.chapterId;
    const mapKey = CHAPTER_MAP_IMAGE[this.currentChapterId] || 'floor_grass';
    this.bgTile = this.add.tileSprite(1000, 800, 2400, 1800, mapKey);
    this.bgTile.setOrigin(0.5, 0.5);
    this.bgTile.setDepth(-100);

    // World Boundaries
    this.cameras.main.setBounds(0, 0, 2000, 1600);

    // Graphics Layers
    this.playerShadow = this.add.graphics().setDepth(5);
    this.fxGraphics = this.add.graphics().setDepth(2000);
    this.uiGraphics = this.add.graphics().setDepth(3000);
    this.playerShieldGfx = this.add.graphics().setDepth(2001);

    // Player Sprite
    this.currentHeroClass = game.heroClass;
    const heroAtlas = HERO_ATLAS_MAP[this.currentHeroClass] || 'hero_5120503';
    this.playerSprite = this.add.sprite(game.player.x, game.player.y, heroAtlas);
    this.playerSprite.setOrigin(0.5, 0.5);
    this.playerSprite.setDepth(100);

    // Camera follow player
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);

    // Keyboard inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
    }
  }

  private registerAllAnimations() {
    const atlases = [
      'hero_5110501',
      'hero_5120503',
      'hero_5130503',
      'm_20038',
      'm_20046',
      'm_20072',
      'm_20081',
      'm_20082',
      'm_20085',
      'm_20111',
      'm_20112'
    ];

    for (const atlasKey of atlases) {
      if (!this.textures.exists(atlasKey)) continue;
      const frameNames = this.textures.get(atlasKey).getFrameNames();
      const groups = new Map<string, string[]>();

      for (const name of frameNames) {
        const parts = name.split('/');
        if (parts.length >= 3) {
          const action = parts[parts.length - 2];
          const filename = parts[parts.length - 1];
          const dirDigit = filename[0];
          const groupKey = `${atlasKey}_${action}_${dirDigit}`;
          if (!groups.has(groupKey)) groups.set(groupKey, []);
          groups.get(groupKey)!.push(name);
        }
      }

      for (const [key, frames] of groups.entries()) {
        frames.sort();
        if (!this.anims.exists(key)) {
          this.anims.create({
            key,
            frames: frames.map(f => ({ key: atlasKey, frame: f })),
            frameRate: key.includes('run') || key.includes('walk') ? 10 : 8,
            repeat: -1
          });
        }
      }
    }

    // Register level_up animation
    if (this.textures.exists('level_up') && !this.anims.exists('fx_level_up_anim')) {
      const levelUpFrames = this.textures.get('level_up').getFrameNames().sort();
      this.anims.create({
        key: 'fx_level_up_anim',
        frames: levelUpFrames.map(f => ({ key: 'level_up', frame: f })),
        frameRate: 18,
        repeat: 0
      });
    }
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;

    // Handle Input
    this.handleInput();

    // Run Engine Update
    game.update(dt);

    // Sync Background if chapter changed
    if (this.currentChapterId !== game.chapterId) {
      this.currentChapterId = game.chapterId;
      const mapKey = CHAPTER_MAP_IMAGE[this.currentChapterId] || 'floor_grass';
      this.bgTile.setTexture(mapKey);
    }

    // Sync Hero Sprite if class changed
    if (this.currentHeroClass !== game.heroClass) {
      this.currentHeroClass = game.heroClass;
      const heroAtlas = HERO_ATLAS_MAP[this.currentHeroClass] || 'hero_5120503';
      this.playerSprite.setTexture(heroAtlas);
    }

    // Sync Player Visuals
    this.syncPlayer();

    // Sync Monsters
    this.syncMonsters();

    // Sync Minions
    this.syncMinions();

    // Consume and Render Skills & Effects
    this.syncEffects(dt);

    // Sync UI (HP bars, Damage texts, Drops)
    this.syncUI(dt);
  }

  private handleInput() {
    let ix = 0;
    let iy = 0;

    if (this.cursors) {
      if (this.cursors.left.isDown || this.wasd?.a.isDown) ix -= 1;
      if (this.cursors.right.isDown || this.wasd?.d.isDown) ix += 1;
      if (this.cursors.up.isDown || this.wasd?.w.isDown) iy -= 1;
      if (this.cursors.down.isDown || this.wasd?.s.isDown) iy += 1;
    }

    // Touch / Mouse Pointer drag
    const pointer = this.input.activePointer;
    if (pointer.isDown && pointer.getDuration() > 80) {
      const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const dx = worldPoint.x - game.player.x;
      const dy = worldPoint.y - game.player.y;
      if (Math.hypot(dx, dy) > 40) {
        ix = dx;
        iy = dy;
      }
    }

    game.setInput(ix, iy);
  }

  private syncPlayer() {
    this.playerSprite.setPosition(game.player.x, game.player.y);
    this.playerSprite.setDepth(game.player.y);

    const { dirDigit, flipX } = getDirInfo(game.player.dir);
    this.playerSprite.setFlipX(flipX);

    const heroAtlas = HERO_ATLAS_MAP[game.heroClass] || 'hero_5120503';
    const action = game.player.moving ? 'run' : 'stand';
    const animKey = `${heroAtlas}_${action}_${dirDigit}`;

    if (this.anims.exists(animKey)) {
      if (!this.playerSprite.anims.isPlaying || this.playerSprite.anims.currentAnim?.key !== animKey) {
        this.playerSprite.play(animKey);
      }
    }

    // Player Shadow
    this.playerShadow.clear();
    this.playerShadow.fillStyle(0x000000, 0.4);
    this.playerShadow.fillEllipse(game.player.x, game.player.y + 40, 50, 20);

    // Golden Shield (Diamond Body)
    this.playerShieldGfx.clear();
    if (game.clock < game.player.shieldUntil) {
      this.playerShieldGfx.lineStyle(3, 0xffd700, 0.85);
      this.playerShieldGfx.strokeCircle(game.player.x, game.player.y, 45);
      this.playerShieldGfx.lineStyle(1.5, 0xffffff, 0.6);
      this.playerShieldGfx.strokeCircle(game.player.x, game.player.y, 42);
    }
  }

  private syncMonsters() {
    const activeIds = new Set<number>();

    for (const m of game.monsters) {
      activeIds.add(m.id);
      let sprite = this.monsterSprites.get(m.id);

      if (!sprite) {
        sprite = this.monsterPool.pop() || this.add.sprite(m.x, m.y, '');
        sprite.setVisible(true);
        this.monsterSprites.set(m.id, sprite);
      }

      sprite.setPosition(m.x, m.y);
      sprite.setDepth(m.y);

      const atlasKey = `m_${m.spriteKey || '20081'}`;
      const { dirDigit, flipX } = getDirInfo(m.dir || 4);
      sprite.setFlipX(flipX);

      if (m.isBoss) {
        sprite.setScale(1.4);
      } else {
        sprite.setScale(1.0);
      }

      const animKey = `${atlasKey}_walk_${dirDigit}`;
      if (this.anims.exists(animKey)) {
        if (!sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== animKey) {
          sprite.play(animKey);
        }
      }
    }

    // Recycle despawned monsters
    for (const [id, sprite] of this.monsterSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.setVisible(false);
        this.monsterPool.push(sprite);
        this.monsterSprites.delete(id);
      }
    }
  }

  private syncMinions() {
    const activeIds = new Set<number>();

    for (const minion of game.minions) {
      activeIds.add(minion.id);
      let sprite = this.minionSprites.get(minion.id);

      if (!sprite) {
        sprite = this.minionPool.pop() || this.add.sprite(minion.x, minion.y, '');
        sprite.setVisible(true);
        this.minionSprites.set(minion.id, sprite);
      }

      sprite.setPosition(minion.x, minion.y);
      sprite.setDepth(minion.y);

      const atlasKey = minion.type === 'skeleton' ? 'm_20082' : 'm_20085';
      const { dirDigit, flipX } = getDirInfo(minion.dir || 4);
      sprite.setFlipX(flipX);

      const animKey = `${atlasKey}_walk_${dirDigit}`;
      if (this.anims.exists(animKey)) {
        if (!sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== animKey) {
          sprite.play(animKey);
        }
      }
    }

    for (const [id, sprite] of this.minionSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.setVisible(false);
        this.minionPool.push(sprite);
        this.minionSprites.delete(id);
      }
    }
  }

  private syncEffects(dt: number) {
    // 1. Take newly generated engine effects
    const newEffects = game.takeEffects();
    for (const e of newEffects) {
      if (e.type === 'level_up') {
        // Spawn authentic Woool golden beam sprite
        if (this.anims.exists('fx_level_up_anim')) {
          const fxSprite = this.add.sprite(e.x, e.y - 40, 'level_up');
          fxSprite.setDepth(e.y + 100);
          fxSprite.setScale(1.2);
          fxSprite.play('fx_level_up_anim');
          fxSprite.on('animationcomplete', () => fxSprite.destroy());
        }
      } else {
        this.activeFxList.push({
          type: e.type,
          x: e.x,
          y: e.y,
          targetX: e.targetX,
          targetY: e.targetY,
          radius: e.radius || 80,
          color: e.color,
          life: 0.35,
          maxLife: 0.35
        });
      }
    }

    // 2. Render graphics effects
    this.fxGraphics.clear();

    for (let i = this.activeFxList.length - 1; i >= 0; i--) {
      const fx = this.activeFxList[i];
      fx.life -= dt;
      const progress = Math.max(0, fx.life / fx.maxLife);

      if (fx.type === 'lightning') {
        // 狂龙紫电: Authentic lightning branch from sky
        this.drawLightning(fx.x, fx.y, progress);
      } else if (fx.type === 'blade_arc') {
        // 抱月刀: 360 degree spinning crescent arc
        this.drawBladeArc(fx.x, fx.y, fx.radius || 110, progress);
      } else if (fx.type === 'talisman') {
        // 幽冥火咒: Flying ghostly blue talisman
        this.drawTalisman(fx.x, fx.y, fx.targetX || fx.x, fx.targetY || fx.y, 1 - progress);
      } else if (fx.type === 'meteor') {
        // 流星火雨: Flame explosion
        this.drawMeteor(fx.x, fx.y, fx.radius || 100, progress);
      } else if (fx.type === 'hell_thunder') {
        // 地狱雷光: Expanding electric ring
        this.drawHellThunder(fx.x, fx.y, fx.radius || 150, progress);
      } else if (fx.type === 'poison') {
        // 施毒术: Poison pool
        this.drawPoison(fx.x, fx.y, fx.radius || 120, progress);
      } else if (fx.type === 'fire_slash') {
        // 烈火剑法: Crimson flaming blade slash
        this.drawFireSlash(fx.x, fx.y, progress);
      }

      if (fx.life <= 0) {
        this.activeFxList.splice(i, 1);
      }
    }
  }

  private drawLightning(x: number, y: number, alpha: number) {
    const gfx = this.fxGraphics;
    const startY = y - 360;

    gfx.lineStyle(4, 0xb042ff, alpha);
    gfx.beginPath();
    gfx.moveTo(x + (Math.random() - 0.5) * 40, startY);

    let curX = x;
    let curY = startY;
    const segments = 6;
    const stepY = 360 / segments;

    for (let i = 1; i < segments; i++) {
      curX += (Math.random() - 0.5) * 50;
      curY += stepY;
      gfx.lineTo(curX, curY);
    }
    gfx.lineTo(x, y);
    gfx.strokePath();

    // Inner bright white core
    gfx.lineStyle(2, 0xffffff, alpha);
    gfx.beginPath();
    gfx.moveTo(x, startY);
    gfx.lineTo(curX, curY);
    gfx.lineTo(x, y);
    gfx.strokePath();

    // Ground impact flash
    gfx.fillStyle(0xcc66ff, alpha * 0.6);
    gfx.fillCircle(x, y, 32 * (1 - alpha * 0.3));
    gfx.fillStyle(0xffffff, alpha * 0.8);
    gfx.fillCircle(x, y, 14);
  }

  private drawBladeArc(x: number, y: number, radius: number, alpha: number) {
    const gfx = this.fxGraphics;
    const currentRadius = radius * (1.1 - alpha * 0.2);

    gfx.lineStyle(6, 0xffd700, alpha * 0.9);
    gfx.strokeCircle(x, y, currentRadius);

    gfx.lineStyle(2, 0xffffff, alpha);
    gfx.strokeCircle(x, y, currentRadius - 3);

    // Glowing flare
    gfx.fillStyle(0xfff0aa, alpha * 0.25);
    gfx.fillCircle(x, y, currentRadius + 5);
  }

  private drawTalisman(x: number, y: number, tx: number, ty: number, progress: number) {
    const gfx = this.fxGraphics;
    const curX = Phaser.Math.Linear(x, tx, progress);
    const curY = Phaser.Math.Linear(y, ty, progress);

    // Talisman paper
    gfx.fillStyle(0x00f0ff, 0.9);
    gfx.fillRect(curX - 6, curY - 12, 12, 24);

    // Soul flame glow
    gfx.fillStyle(0x0088ff, 0.5);
    gfx.fillCircle(curX, curY, 18);
  }

  private drawMeteor(x: number, y: number, radius: number, alpha: number) {
    const gfx = this.fxGraphics;
    const r = radius * (1.2 - alpha * 0.4);

    gfx.fillStyle(0xff3300, alpha * 0.7);
    gfx.fillCircle(x, y, r);

    gfx.fillStyle(0xff9900, alpha * 0.9);
    gfx.fillCircle(x, y, r * 0.6);

    gfx.fillStyle(0xffff66, alpha);
    gfx.fillCircle(x, y, r * 0.3);
  }

  private drawHellThunder(x: number, y: number, radius: number, alpha: number) {
    const gfx = this.fxGraphics;
    const curR = radius * (1 - alpha);

    gfx.lineStyle(5, 0x3388ff, alpha);
    gfx.strokeCircle(x, y, curR);

    gfx.lineStyle(2, 0xffffff, alpha);
    gfx.strokeCircle(x, y, curR + 6);
  }

  private drawPoison(x: number, y: number, radius: number, alpha: number) {
    const gfx = this.fxGraphics;
    gfx.fillStyle(0x22c55e, alpha * 0.4);
    gfx.fillCircle(x, y, radius);
    gfx.lineStyle(2, 0x16a34a, alpha * 0.7);
    gfx.strokeCircle(x, y, radius);
  }

  private drawFireSlash(x: number, y: number, alpha: number) {
    const gfx = this.fxGraphics;
    gfx.lineStyle(8, 0xff2200, alpha);
    gfx.beginPath();
    gfx.arc(x, y, 40, -Math.PI / 4, (3 * Math.PI) / 4);
    gfx.strokePath();

    gfx.lineStyle(3, 0xffbb00, alpha);
    gfx.beginPath();
    gfx.arc(x, y, 42, -Math.PI / 4, (3 * Math.PI) / 4);
    gfx.strokePath();
  }

  private syncUI(_dt: number) {
    const gfx = this.uiGraphics;
    gfx.clear();

    // 1. Monster overhead health bars
    for (const m of game.monsters) {
      if (m.hp < m.maxHp) {
        const barW = m.isBoss ? 70 : 36;
        const barH = m.isBoss ? 6 : 4;
        const bx = m.x - barW / 2;
        const by = m.y - (m.isBoss ? 65 : 45);

        // Bar background
        gfx.fillStyle(0x000000, 0.7);
        gfx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

        // HP fill
        const ratio = Math.max(0, m.hp / m.maxHp);
        gfx.fillStyle(m.isBoss ? 0xff2222 : 0xdd3333, 0.95);
        gfx.fillRect(bx, by, barW * ratio, barH);
      }
    }

    // 2. Drops (exp crystal, gold, potion)
    for (const d of game.drops) {
      if (d.type === 'exp') {
        // Glowing cyan/green exp crystal
        gfx.fillStyle(0x00ffcc, 0.9);
        gfx.fillCircle(d.x, d.y, 6);
        gfx.fillStyle(0xffffff, 0.9);
        gfx.fillCircle(d.x, d.y, 2.5);
      } else if (d.type === 'gold') {
        // Gold coin
        gfx.fillStyle(0xffdd00, 0.95);
        gfx.fillCircle(d.x, d.y, 5);
        gfx.lineStyle(1.5, 0x996600, 1);
        gfx.strokeCircle(d.x, d.y, 5);
      } else {
        // Red potion bottle
        gfx.fillStyle(0xff2244, 0.95);
        gfx.fillRect(d.x - 4, d.y - 6, 8, 12);
        gfx.fillStyle(0xffffff, 0.8);
        gfx.fillRect(d.x - 2, d.y - 4, 3, 3);
      }
    }

    // 3. Floating Damage Numbers
    const activeTextIds = new Set<number>();
    for (const d of game.damageNumbers) {
      activeTextIds.add(d.id);
      let textObj = this.damageTexts.get(d.id);

      if (!textObj) {
        textObj = this.damageTextPool.pop() || this.add.text(d.x, d.y, d.text, {
          fontFamily: 'serif',
          fontSize: d.crit ? '20px' : '15px',
          fontStyle: 'bold',
          color: d.color,
          stroke: '#000000',
          strokeThickness: 3
        });
        textObj.setOrigin(0.5, 0.5);
        textObj.setDepth(3500);
        textObj.setVisible(true);
        this.damageTexts.set(d.id, textObj);
      }

      textObj.setPosition(d.x, d.y);
      textObj.setText(d.text);
      textObj.setColor(d.color);
      textObj.setAlpha(Math.min(1, d.life * 2));
      if (d.crit) textObj.setFontSize('20px');
      else textObj.setFontSize('15px');
    }

    for (const [id, textObj] of this.damageTexts.entries()) {
      if (!activeTextIds.has(id)) {
        textObj.setVisible(false);
        this.damageTextPool.push(textObj);
        this.damageTexts.delete(id);
      }
    }
  }
}

let gameInstance: Phaser.Game | null = null;

export function bootPhaser() {
  if (gameInstance) return;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'world',
    backgroundColor: '#0c0f12',
    pixelArt: true,
    antialias: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight
    },
    scene: [BattleScene],
    audio: { noAudio: true },
    fps: { target: 60 }
  };

  gameInstance = new Phaser.Game(config);
  (window as any).__phaserGame = gameInstance;
}
