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
  hot_desert: 'map_hot_desert',
  deadwater_marsh: 'map_deadwater_marsh',
  frozen_citadel: 'map_frozen_citadel',
  iron_citadel: 'map_iron_citadel'
};

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

  private fxSprites = new Set<Phaser.GameObjects.Sprite>();
  private fxTweens = new Set<Phaser.Tweens.Tween>();
  private fxTimers = new Set<Phaser.Time.TimerEvent>();
  private lastGameClock = 0;

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
    this.load.image('map_deadwater_marsh', assetUrl('assets/woool/maps/map_forbidden_ruins.jpg'));
    this.load.image('map_frozen_citadel', assetUrl('assets/woool/maps/map_frozen_city.jpg'));
    this.load.image('map_iron_citadel', assetUrl('assets/woool/maps/map_iron_citadel.jpg'));

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
    this.load.atlas('fx_2202', assetUrl('assets/woool/skills_fx/s_2202@0.png'), assetUrl('assets/woool/skills_fx/s_2202@0.json'));
    this.load.atlas('fx_2001', assetUrl('assets/woool/skills_fx/s_2001@0.png'), assetUrl('assets/woool/skills_fx/s_2001@0.json'));
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

    // Player Shield Sprite (pre-extracted clean alpha avoids white washout on bright terrain)
    this.playerShieldSprite = this.add.sprite(game.player.x, game.player.y, 'fx_1008');
    this.playerShieldSprite.setOrigin(0.5, 0.5);
    this.playerShieldSprite.setDepth(2001);
    this.playerShieldSprite.setBlendMode(Phaser.BlendModes.NORMAL);
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

    // Register Authentic Woool Skill Animations (non-directional)
    const skillAnimConfigs: { key: string; atlas: string; prefix: string; fps: number; repeat?: number; startIndex?: number }[] = [
      { key: 'fx_lightning_cast_anim', atlas: 'fx_2010', prefix: '2010/casting', fps: 20 },
      { key: 'fx_lightning_anim', atlas: 'fx_2010', prefix: '2010/hit', fps: 18, startIndex: 2 },
      { key: 'fx_meteor_cast_anim', atlas: 'fx_2011', prefix: '2011/casting', fps: 20 },
      { key: 'fx_meteor_drop_anim', atlas: 'fx_2202', prefix: '2202/track', fps: 16, repeat: -1 },
      { key: 'fx_meteor_boom_anim', atlas: 'fx_2202', prefix: '2202/hit', fps: 22 },
      { key: 'fx_hell_thunder_anim', atlas: 'fx_2003', prefix: '2003/hit', fps: 18 },
      { key: 'fx_talisman_cast_anim', atlas: 'fx_3011', prefix: '3011/casting', fps: 18 },
      { key: 'fx_talisman_fly_anim', atlas: 'fx_3011', prefix: '3011/track', fps: 12, repeat: -1 },
      { key: 'fx_talisman_hit_anim', atlas: 'fx_3011', prefix: '3011/hit', fps: 20 },
      { key: 'fx_poison_cast_anim', atlas: 'fx_3004', prefix: '3004/casting', fps: 16 },
      { key: 'fx_poison_anim', atlas: 'fx_3004', prefix: '3004/hit', fps: 16 },
      { key: 'fx_diamond_body_cast_anim', atlas: 'fx_1008', prefix: '1008/casting', fps: 12 },
      { key: 'fx_diamond_body_anim', atlas: 'fx_1008', prefix: '1008/loop', fps: 14, repeat: -1 },
      { key: 'fx_wind_shield_anim', atlas: 'fx_2009', prefix: '2009/loop', fps: 14, repeat: -1 },
      { key: 'fx_shinsu_anim', atlas: 'fx_3007', prefix: '3007/hit', fps: 16, startIndex: 10 },
      { key: 'fx_shinsu_hit_anim', atlas: 'fx_2001', prefix: '2001/hit', fps: 20 },
      { key: 'fx_skeleton_anim', atlas: 'fx_3012', prefix: '3012/hit', fps: 18 }
    ];

    for (const cfg of skillAnimConfigs) {
      if (this.textures.exists(cfg.atlas) && !this.anims.exists(cfg.key)) {
        const allFrames = this.textures.get(cfg.atlas).getFrameNames()
          .filter(f => f.startsWith(cfg.prefix))
          .sort();
        const frameNames = cfg.startIndex && cfg.startIndex < allFrames.length
          ? allFrames.slice(cfg.startIndex)
          : allFrames;
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

    // Register 5-direction Woool Skill Animations separately (0..4) so casts never cycle across directions
    const dirSkillConfigs: { baseKey: string; atlas: string; prefix: string; fps: number; startIndex?: number }[] = [
      { baseKey: 'fx_blade_arc_anim', atlas: 'fx_1004', prefix: '1004/attack', fps: 14, startIndex: 2 },
      { baseKey: 'fx_fire_slash_anim', atlas: 'fx_1006', prefix: '1006/attack', fps: 16, startIndex: 3 },
      { baseKey: 'fx_dash_anim', atlas: 'fx_1010', prefix: '1010/attack', fps: 15 }
    ];

    for (const cfg of dirSkillConfigs) {
      if (!this.textures.exists(cfg.atlas)) continue;
      const allFrames = this.textures.get(cfg.atlas).getFrameNames();
      for (let d = 0; d <= 4; d++) {
        const animKey = `${cfg.baseKey}_d${d}`;
        if (this.anims.exists(animKey)) continue;
        const dirPrefix = `${cfg.prefix}/${d}`;
        const sortedFrames = allFrames.filter(f => f.startsWith(dirPrefix)).sort();
        const frameNames = cfg.startIndex && cfg.startIndex < sortedFrames.length
          ? sortedFrames.slice(cfg.startIndex)
          : sortedFrames;
        if (frameNames.length > 0) {
          this.anims.create({
            key: animKey,
            frames: frameNames.map(f => ({ key: cfg.atlas, frame: f })),
            frameRate: cfg.fps,
            repeat: 0
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

    // Clear stale FX immediately when restarting a run or switching chapter/class
    if (
      game.phase !== 'battle' ||
      game.clock < this.lastGameClock - 0.05 ||
      this.currentChapterId !== game.chapterId ||
      this.currentHeroClass !== game.heroClass
    ) {
      this.clearTransientFx();
    }
    this.lastGameClock = game.clock;

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
    this.playerShadow.fillStyle(0x000000, 0.42);
    this.playerShadow.fillEllipse(game.player.x, game.player.y + 40, 50, 20);

    // Subtle hurt flash feedback
    if (game.player.invulnerableTime > 0 && game.clock > 1.5 && Math.floor(game.clock * 20) % 2 === 0) {
      this.playerSprite.setTint(0xff6666);
    } else {
      this.playerSprite.clearTint();
    }

    // Shield Aura Sprite (Diamond Body / Wind Shield)
    if (game.clock < game.player.shieldUntil) {
      const isWizard = game.heroClass === 'wizard';
      this.playerShieldSprite.setVisible(true);
      this.playerShieldSprite.setPosition(game.player.x, game.player.y + (isWizard ? 28 : 4));
      this.playerShieldSprite.setScale(isWizard ? 0.86 : 1.08);
      this.playerShieldSprite.setAlpha(isWizard ? 0.92 : 0.95);
      this.playerShieldSprite.setDepth(game.player.y + (isWizard ? 4 : -2));
      const shieldAnim = isWizard ? 'fx_wind_shield_anim' : 'fx_diamond_body_anim';
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
        sprite.setScale(m.spriteKey === '20085' ? 1.25 : 1.48);
        this.playerShadow.lineStyle(3, 0xff2a2a, 0.85);
        this.playerShadow.strokeEllipse(m.x, m.y + 38, 96, 36);
      } else if (m.isElite) {
        sprite.setScale(m.spriteKey === '20085' ? 1.05 : 1.22);
        this.playerShadow.lineStyle(2, 0xd488ff, 0.85);
        this.playerShadow.strokeEllipse(m.x, m.y + 34, 68, 26);
      } else {
        sprite.setScale(m.spriteKey === '20085' ? 0.85 : 1.0);
      }

      if (m.poisonUntil && game.clock < m.poisonUntil) {
        sprite.setTint(0x66ff88);
      } else if (m.burnUntil && game.clock < m.burnUntil) {
        sprite.setTint(0xff9955);
      } else if (m.stunUntil && game.clock < m.stunUntil) {
        sprite.setTint(0xd8a8ff);
      } else if (m.slowUntil && game.clock < m.slowUntil) {
        sprite.setTint(0x88ddff);
      } else {
        sprite.clearTint();
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

  private trackSprite<T extends Phaser.GameObjects.Sprite>(sprite: T): T {
    this.fxSprites.add(sprite);
    sprite.once('destroy', () => this.fxSprites.delete(sprite));
    return sprite;
  }

  private trackTween(config: Phaser.Types.Tweens.TweenBuilderConfig): Phaser.Tweens.Tween {
    const userOnComplete = config.onComplete;
    const tween = this.tweens.add({
      ...config,
      onComplete: (tw, targets, ...rest) => {
        this.fxTweens.delete(tw);
        if (userOnComplete) userOnComplete(tw, targets, ...rest);
      },
      onStop: (tw) => {
        this.fxTweens.delete(tw);
      }
    });
    this.fxTweens.add(tween);
    return tween;
  }

  private scheduleFx(delayMs: number, fn: () => void) {
    if (delayMs <= 0) {
      fn();
      return;
    }
    const timer = this.time.delayedCall(delayMs, () => {
      this.fxTimers.delete(timer);
      fn();
    });
    this.fxTimers.add(timer);
  }

  private clearTransientFx() {
    for (const t of this.fxTimers) t.remove(false);
    this.fxTimers.clear();
    for (const tw of this.fxTweens) tw.stop();
    this.fxTweens.clear();
    for (const sp of Array.from(this.fxSprites)) {
      if (sp && sp.scene) sp.destroy();
    }
    this.fxSprites.clear();
    if (this.playerShieldSprite) this.playerShieldSprite.setVisible(false);
  }

  private spawnSkillEffect(
    x: number,
    y: number,
    texture: string,
    animKey: string,
    depth: number,
    scale: number,
    flipX = false,
    blendMode: Phaser.BlendModes | number = Phaser.BlendModes.NORMAL
  ) {
    if (!this.anims.exists(animKey)) return;
    const fx = this.trackSprite(this.add.sprite(x, y, texture));
    fx.setOrigin(0.5, 0.5);
    fx.setDepth(depth);
    fx.setScale(scale);
    fx.setFlipX(flipX);
    fx.setBlendMode(blendMode);
    fx.play(animKey);
    fx.on('animationcomplete', () => fx.destroy());
  }

  private spawnTalismanProjectile(startX: number, startY: number, targetX: number, targetY: number) {
    const sy = startY - 18;
    const ty = targetY - 14;
    const dist = Math.hypot(targetX - startX, ty - sy);

    if (this.anims.exists('fx_talisman_fly_anim') && dist > 28) {
      const proj = this.trackSprite(this.add.sprite(startX, sy, 'fx_3011'));
      proj.setOrigin(0.5, 0.5);
      proj.setScale(0.92);
      proj.setDepth(Math.max(startY, targetY) + 40);
      proj.setRotation(Math.atan2(ty - sy, targetX - startX));
      proj.setBlendMode(Phaser.BlendModes.NORMAL);
      proj.play('fx_talisman_fly_anim');

      const duration = Math.max(240, Math.min(420, Math.round(dist * 1.15)));
      this.trackTween({
        targets: proj,
        x: targetX,
        y: ty,
        duration,
        ease: 'Linear',
        onComplete: () => {
          proj.destroy();
          this.spawnSkillEffect(targetX, targetY + 4, 'fx_3011', 'fx_talisman_hit_anim', targetY + 25, 0.94);
        }
      });
    } else {
      this.spawnSkillEffect(targetX, targetY + 4, 'fx_3011', 'fx_talisman_hit_anim', targetY + 25, 0.94);
    }
  }

  private spawnMeteorEffect(x: number, y: number, delayMs: number) {
    this.scheduleFx(delayMs, () => {
      const startX = x + 68;
      const startY = y - 160;
      const endY = y - 10;

      if (this.anims.exists('fx_meteor_drop_anim')) {
        const drop = this.trackSprite(this.add.sprite(startX, startY, 'fx_2202'));
        drop.setOrigin(0.5, 0.5);
        drop.setScale(0.92);
        drop.setDepth(y + 80);
        drop.setRotation(Math.atan2(endY - startY, x - startX));
        drop.setBlendMode(Phaser.BlendModes.NORMAL);
        drop.play('fx_meteor_drop_anim');

        this.trackTween({
          targets: drop,
          x,
          y: endY,
          duration: 115,
          ease: 'Quad.easeIn',
          onComplete: () => {
            drop.destroy();
            this.spawnSkillEffect(x, endY, 'fx_2202', 'fx_meteor_boom_anim', y + 35, 0.92);
            this.spawnSkillEffect(x, y - 16, 'fx_2011', 'fx_meteor_cast_anim', y + 42, 0.68);
          }
        });
      } else {
        this.spawnSkillEffect(x, y - 16, 'fx_2011', 'fx_meteor_cast_anim', y + 42, 0.68);
      }
    });
  }

  private spawnDashEffect(startX: number, startY: number, targetX: number, targetY: number, dir: number) {
    const heroAtlas = HERO_ATLAS_MAP[this.currentHeroClass] || 'hero_5110501';
    const currentFrame = this.playerSprite.frame?.name;
    const { dirDigit, flipX } = getDirInfo(dir);

    // Translucent cyan warrior afterimages bridging start -> arrival
    if (currentFrame) {
      for (const t of [0.22, 0.52, 0.8]) {
        const ax = startX + (targetX - startX) * t;
        const ay = startY + (targetY - startY) * t;
        const ghost = this.trackSprite(this.add.sprite(ax, ay, heroAtlas, currentFrame));
        ghost.setOrigin(0.5, 0.5);
        ghost.setFlipX(flipX);
        ghost.setDepth(ay - 1);
        ghost.setTint(0x66ccff);
        ghost.setAlpha(0.62);
        this.trackTween({
          targets: ghost,
          alpha: 0,
          duration: 240,
          ease: 'Quad.easeOut',
          onComplete: () => ghost.destroy()
        });
      }
    }

    const animKey = `fx_dash_anim_d${dirDigit}`;
    if (!this.anims.exists(animKey)) return;

    // Gliding dash slash traveling with the warrior
    const streak = this.trackSprite(this.add.sprite(startX, startY, 'fx_1010'));
    streak.setOrigin(0.5, 0.5);
    streak.setScale(1.45);
    streak.setFlipX(flipX);
    streak.setDepth(Math.max(startY, targetY) + 25);
    streak.play(animKey);
    streak.on('animationcomplete', () => streak.destroy());
    this.trackTween({
      targets: streak,
      x: targetX,
      y: targetY,
      duration: 135,
      ease: 'Quad.easeOut'
    });

    // Crisp impact dash crescent at destination
    this.scheduleFx(45, () => {
      this.spawnSkillEffect(targetX, targetY, 'fx_1010', animKey, targetY + 30, 1.55, flipX);
    });
  }

  private syncEffects(_dt: number) {
    const directionalFx: Record<string, { tex: string; baseAnim: string; dy?: number; dDepth?: number; scale: number; followPlayer?: boolean }> = {
      blade_arc: { tex: 'fx_1004', baseAnim: 'fx_blade_arc_anim', dy: 4, dDepth: 18, scale: 1.22, followPlayer: true },
      fire_slash: { tex: 'fx_1006', baseAnim: 'fx_fire_slash_anim', dy: 2, dDepth: 30, scale: 1.2 },
      skeleton_hit: { tex: 'fx_1004', baseAnim: 'fx_blade_arc_anim', dy: 6, dDepth: 16, scale: 0.72 }
    };

    const fxTable: Record<string, { tex: string; anim: string; dy?: number; dDepth?: number; scale?: number; followPlayer?: boolean }> = {
      level_up: { tex: 'level_up', anim: 'fx_level_up_anim', dy: -40, dDepth: 100, scale: 1.15 },
      lightning: { tex: 'fx_2010', anim: 'fx_lightning_anim', dy: 14, dDepth: 200, scale: 0.8 },
      hell_thunder: { tex: 'fx_2003', anim: 'fx_hell_thunder_anim', dy: -6, dDepth: 15, scale: 1.0, followPlayer: true },
      poison: { tex: 'fx_3004', anim: 'fx_poison_anim', dy: -14, dDepth: 18, scale: 1.05 },
      diamond_body: { tex: 'fx_1008', anim: 'fx_diamond_body_cast_anim', dy: -6, dDepth: 12, scale: 1.25, followPlayer: true },
      shinsu: { tex: 'fx_3007', anim: 'fx_shinsu_anim', dy: 6, dDepth: 20, scale: 1.15 },
      shinsu_hit: { tex: 'fx_2001', anim: 'fx_shinsu_hit_anim', dy: -10, dDepth: 25, scale: 0.78 },
      skeleton: { tex: 'fx_3012', anim: 'fx_skeleton_anim', dy: 10, dDepth: 20, scale: 0.88 }
    };

    const newEffects = game.takeEffects();
    const castPlayedThisTick = new Set<string>();
    let meteorIndex = 0;

    for (const e of newEffects) {
      if (e.type === 'lightning' && !castPlayedThisTick.has('lightning')) {
        castPlayedThisTick.add('lightning');
        this.spawnSkillEffect(
          this.playerSprite.x,
          this.playerSprite.y - 6,
          'fx_2010',
          'fx_lightning_cast_anim',
          this.playerSprite.y + 15,
          1.05
        );
      }

      if (e.type === 'poison' && !castPlayedThisTick.has('poison')) {
        castPlayedThisTick.add('poison');
        this.spawnSkillEffect(
          this.playerSprite.x,
          this.playerSprite.y - 8,
          'fx_3004',
          'fx_poison_cast_anim',
          this.playerSprite.y + 15,
          0.85
        );
      }

      if (e.type === 'talisman') {
        if (!castPlayedThisTick.has('talisman')) {
          castPlayedThisTick.add('talisman');
          this.spawnSkillEffect(
            this.playerSprite.x,
            this.playerSprite.y + 16,
            'fx_3011',
            'fx_talisman_cast_anim',
            this.playerSprite.y - 1,
            0.85
          );
        }
        this.spawnTalismanProjectile(
          e.x,
          e.y,
          e.targetX ?? e.x,
          e.targetY ?? e.y
        );
        continue;
      }

      if (e.type === 'meteor') {
        this.spawnMeteorEffect(e.x, e.y, Math.min(160, meteorIndex * 45));
        meteorIndex++;
        continue;
      }

      if (e.type === 'dash') {
        this.spawnDashEffect(
          e.x,
          e.y,
          e.targetX ?? e.x,
          e.targetY ?? e.y,
          e.dir ?? game.player.dir
        );
        continue;
      }

      const dirCfg = directionalFx[e.type];
      if (dirCfg) {
        const sx = dirCfg.followPlayer ? this.playerSprite.x : e.x;
        const sy = dirCfg.followPlayer ? this.playerSprite.y : e.y;
        const { dirDigit, flipX } = getDirInfo(e.dir ?? game.player.dir);
        this.spawnSkillEffect(
          sx,
          sy + (dirCfg.dy || 0),
          dirCfg.tex,
          `${dirCfg.baseAnim}_d${dirDigit}`,
          sy + (dirCfg.dDepth || 0),
          dirCfg.scale,
          flipX
        );
        continue;
      }

      const cfg = fxTable[e.type];
      if (!cfg) continue;
      const sx = cfg.followPlayer ? this.playerSprite.x : e.x;
      const sy = cfg.followPlayer ? this.playerSprite.y : e.y;
      let scale = cfg.scale || 1.0;
      if (e.radius && e.type === 'hell_thunder') {
        scale = Math.max(0.85, Math.min(1.12, e.radius / 165));
      } else if (e.radius && e.type === 'poison') {
        scale = Math.max(0.92, Math.min(1.18, e.radius / 115));
      }
      this.spawnSkillEffect(
        sx,
        sy + (cfg.dy || 0),
        cfg.tex,
        cfg.anim,
        sy + (cfg.dDepth || 0),
        scale
      );
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
