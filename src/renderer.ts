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
  sunset_island: 'map_sunset_island',
  central_state: 'map_central_state',
  hot_desert: 'map_hot_desert'
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
  private bgImage!: Phaser.GameObjects.Image;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Graphics;
  private playerShieldSprite!: Phaser.GameObjects.Sprite;

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
    // 1. High-Resolution 2.5D Isometric City & Fortress Maps
    this.load.image('map_sunset_island', assetUrl('assets/woool/maps/map_sunset_town.jpg'));
    this.load.image('map_central_state', assetUrl('assets/woool/maps/map_central_city.jpg'));
    this.load.image('map_hot_desert', assetUrl('assets/woool/maps/map_desert_city.jpg'));

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
    this.load.atlas('fx_2010', assetUrl('assets/woool/skills_fx/s_2010@0.png'), assetUrl('assets/woool/skills_fx/s_2010@0.json'));
    this.load.atlas('fx_1004', assetUrl('assets/woool/skills_fx/s_1004@0.png'), assetUrl('assets/woool/skills_fx/s_1004@0.json'));
    this.load.atlas('fx_2011', assetUrl('assets/woool/skills_fx/s_2011@0.png'), assetUrl('assets/woool/skills_fx/s_2011@0.json'));
    this.load.atlas('fx_2003', assetUrl('assets/woool/skills_fx/s_2003@0.png'), assetUrl('assets/woool/skills_fx/s_2003@0.json'));
    this.load.atlas('fx_1006', assetUrl('assets/woool/skills_fx/s_1006@0.png'), assetUrl('assets/woool/skills_fx/s_1006@0.json'));
    this.load.atlas('fx_3011', assetUrl('assets/woool/skills_fx/s_3011@0.png'), assetUrl('assets/woool/skills_fx/s_3011@0.json'));
    this.load.atlas('fx_3004', assetUrl('assets/woool/skills_fx/s_3004@0.png'), assetUrl('assets/woool/skills_fx/s_3004@0.json'));
    this.load.atlas('fx_1008', assetUrl('assets/woool/skills_fx/s_1008@0.png'), assetUrl('assets/woool/skills_fx/s_1008@0.json'));
    this.load.atlas('fx_2009', assetUrl('assets/woool/skills_fx/s_2009@0.png'), assetUrl('assets/woool/skills_fx/s_2009@0.json'));
    this.load.atlas('fx_3007', assetUrl('assets/woool/skills_fx/s_3007@0.png'), assetUrl('assets/woool/skills_fx/s_3007@0.json'));
    this.load.atlas('fx_3012', assetUrl('assets/woool/skills_fx/s_3012@0.png'), assetUrl('assets/woool/skills_fx/s_3012@0.json'));
    this.load.atlas('fx_1010', assetUrl('assets/woool/skills_fx/s_1010@0.png'), assetUrl('assets/woool/skills_fx/s_1010@0.json'));
  }

  create() {
    this.registerAllAnimations();

    // Map Background (Full-Scene High-Resolution 2.5D Isometric City)
    this.currentChapterId = game.chapterId;
    const mapKey = CHAPTER_MAP_IMAGE[this.currentChapterId] || 'map_sunset_island';
    this.bgImage = this.add.image(1376, 768, mapKey);
    this.bgImage.setOrigin(0.5, 0.5);
    this.bgImage.setDepth(-100);

    // World Boundaries
    this.cameras.main.setBounds(0, 0, 2752, 1536);

    // Graphics Layers
    this.playerShadow = this.add.graphics().setDepth(5);
    this.fxGraphics = this.add.graphics().setDepth(2000);
    this.uiGraphics = this.add.graphics().setDepth(3000);

    // Player Shield Sprite
    this.playerShieldSprite = this.add.sprite(game.player.x, game.player.y, 'fx_1008');
    this.playerShieldSprite.setOrigin(0.5, 0.5);
    this.playerShieldSprite.setDepth(2001);
    this.playerShieldSprite.setVisible(false);

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

    // Register Authentic Woool Skill Animations
    const skillAnimConfigs = [
      { key: 'fx_lightning_anim', atlas: 'fx_2010', prefix: '2010/hit', fps: 18 },
      { key: 'fx_blade_arc_anim', atlas: 'fx_1004', prefix: '1004/attack', fps: 24 },
      { key: 'fx_meteor_anim', atlas: 'fx_2011', prefix: '2011/hit', fps: 20 },
      { key: 'fx_hell_thunder_anim', atlas: 'fx_2003', prefix: '2003/hit', fps: 16 },
      { key: 'fx_fire_slash_anim', atlas: 'fx_1006', prefix: '1006/attack', fps: 24 },
      { key: 'fx_talisman_fly_anim', atlas: 'fx_3011', prefix: '3011/track', fps: 12, repeat: -1 },
      { key: 'fx_talisman_hit_anim', atlas: 'fx_3011', prefix: '3011/hit', fps: 18 },
      { key: 'fx_poison_anim', atlas: 'fx_3004', prefix: '3004/hit', fps: 14 },
      { key: 'fx_diamond_body_anim', atlas: 'fx_1008', prefix: '1008/loop', fps: 14, repeat: -1 },
      { key: 'fx_wind_shield_anim', atlas: 'fx_2009', prefix: '2009/loop', fps: 14, repeat: -1 },
      { key: 'fx_shinsu_anim', atlas: 'fx_3007', prefix: '3007/hit', fps: 18 },
      { key: 'fx_skeleton_anim', atlas: 'fx_3012', prefix: '3012/hit', fps: 16 },
      { key: 'fx_dash_anim', atlas: 'fx_1010', prefix: '1010/attack', fps: 20 }
    ];

    for (const cfg of skillAnimConfigs) {
      if (this.textures.exists(cfg.atlas) && !this.anims.exists(cfg.key)) {
        const frameNames = this.textures.get(cfg.atlas).getFrameNames()
          .filter(f => f.startsWith(cfg.prefix))
          .sort();
        if (frameNames.length > 0) {
          this.anims.create({
            key: cfg.key,
            frames: frameNames.map(f => ({ key: cfg.atlas, frame: f })),
            frameRate: cfg.fps,
            repeat: cfg.repeat !== undefined ? cfg.repeat : 0
          });
        }
      }
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
      const mapKey = CHAPTER_MAP_IMAGE[this.currentChapterId] || 'map_sunset_island';
      this.bgImage.setTexture(mapKey);
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

    // Shield Aura Sprite (Diamond Body / Wind Shield)
    if (game.clock < game.player.shieldUntil) {
      this.playerShieldSprite.setVisible(true);
      this.playerShieldSprite.setPosition(game.player.x, game.player.y);
      this.playerShieldSprite.setDepth(game.player.y + 1);
      const shieldAnim = game.heroClass === 'wizard' ? 'fx_wind_shield_anim' : 'fx_diamond_body_anim';
      if (this.anims.exists(shieldAnim) && (!this.playerShieldSprite.anims.isPlaying || this.playerShieldSprite.anims.currentAnim?.key !== shieldAnim)) {
        this.playerShieldSprite.play(shieldAnim);
      }
    } else {
      this.playerShieldSprite.setVisible(false);
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

  private syncEffects(_dt: number) {
    // Take newly generated engine effects and play authentic Woool sprite animations
    const newEffects = game.takeEffects();
    for (const e of newEffects) {
      if (e.type === 'level_up') {
        if (this.anims.exists('fx_level_up_anim')) {
          const fx = this.add.sprite(e.x, e.y - 40, 'level_up');
          fx.setDepth(e.y + 100);
          fx.setScale(1.2);
          fx.play('fx_level_up_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      } else if (e.type === 'lightning') {
        // 狂龙紫电: Authentic Woool purple lightning
        if (this.anims.exists('fx_lightning_anim')) {
          const fx = this.add.sprite(e.x, e.y - 50, 'fx_2010');
          fx.setDepth(e.y + 200);
          fx.setScale(1.1);
          fx.play('fx_lightning_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      } else if (e.type === 'blade_arc') {
        // 抱月刀: Authentic Woool 360 crescent blade sweep
        if (this.anims.exists('fx_blade_arc_anim')) {
          const fx = this.add.sprite(this.playerSprite.x, this.playerSprite.y, 'fx_1004');
          fx.setDepth(this.playerSprite.y + 15);
          fx.setScale(1.15);
          fx.play('fx_blade_arc_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      } else if (e.type === 'meteor') {
        // 流星火雨: Authentic Woool fiery meteor explosion
        if (this.anims.exists('fx_meteor_anim')) {
          const fx = this.add.sprite(e.x, e.y - 25, 'fx_2011');
          fx.setDepth(e.y + 40);
          fx.setScale(1.0);
          fx.play('fx_meteor_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      } else if (e.type === 'hell_thunder') {
        // 地狱雷光: Authentic Woool electric burst ring
        if (this.anims.exists('fx_hell_thunder_anim')) {
          const fx = this.add.sprite(this.playerSprite.x, this.playerSprite.y, 'fx_2003');
          fx.setDepth(this.playerSprite.y + 15);
          fx.setScale(1.2);
          fx.play('fx_hell_thunder_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      } else if (e.type === 'fire_slash') {
        // 烈火剑法: Authentic Woool fire blade explosion
        if (this.anims.exists('fx_fire_slash_anim')) {
          const fx = this.add.sprite(e.x, e.y, 'fx_1006');
          fx.setDepth(e.y + 30);
          fx.setScale(1.05);
          fx.play('fx_fire_slash_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      } else if (e.type === 'talisman') {
        // 幽冥火咒: Authentic Woool talisman hit explosion
        if (this.anims.exists('fx_talisman_hit_anim')) {
          const tx = e.targetX || e.x;
          const ty = e.targetY || e.y;
          const fx = this.add.sprite(tx, ty, 'fx_3011');
          fx.setDepth(ty + 20);
          fx.setScale(1.0);
          fx.play('fx_talisman_hit_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      } else if (e.type === 'poison') {
        // 施毒术: Authentic Woool poison cloud
        if (this.anims.exists('fx_poison_anim')) {
          const fx = this.add.sprite(e.x, e.y, 'fx_3004');
          fx.setDepth(e.y - 10);
          fx.setScale(1.1);
          fx.play('fx_poison_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      } else if (e.type === 'dash') {
        // 突斩: Authentic Woool assault burst
        if (this.anims.exists('fx_dash_anim')) {
          const fx = this.add.sprite(e.x, e.y, 'fx_1010');
          fx.setDepth(e.y + 20);
          fx.setScale(1.0);
          fx.play('fx_dash_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      } else if (e.type === 'shinsu') {
        // 召唤神兽: Authentic Woool sacred beast flame
        if (this.anims.exists('fx_shinsu_anim')) {
          const fx = this.add.sprite(e.x, e.y, 'fx_3007');
          fx.setDepth(e.y + 20);
          fx.setScale(1.0);
          fx.play('fx_shinsu_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      } else if (e.type === 'skeleton') {
        // 强化骷髅: Authentic Woool double axe strike
        if (this.anims.exists('fx_skeleton_anim')) {
          const fx = this.add.sprite(e.x, e.y, 'fx_3012');
          fx.setDepth(e.y + 20);
          fx.setScale(1.0);
          fx.play('fx_skeleton_anim');
          fx.on('animationcomplete', () => fx.destroy());
        }
      }
    }
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
