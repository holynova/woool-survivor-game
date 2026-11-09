import type {
  HeroClass,
  GamePhase,
  PlayerState,
  ActiveSkillState,
  ActivePassiveState,
  MonsterEntity,
  MinionEntity,
  DropEntity,
  DamageNumber,
  EffectEvent
} from './types';
import { WOOWL_SKILLS, WOOWL_PASSIVES } from './config/skills';
import { WOOWL_CHAPTERS } from './config/chapters';
import { sound } from './audio';

export function calcDirection(dx: number, dy: number): number {
  const angle = Math.atan2(dy, dx);
  const octant = Math.round((angle + Math.PI / 2) / (Math.PI / 4));
  return (octant % 8 + 8) % 8;
}

export class GameEngine {
  phase: GamePhase = 'lobby';
  heroClass: HeroClass = 'wizard';
  chapterId = 'sunset_island';

  clock = 0;
  wave = 1;
  waveTimer = 0;
  bossSpawned = false;
  bossDefeated = false;

  inputX = 0;
  inputY = 0;

  player: PlayerState = {
    x: 1000,
    y: 800,
    hp: 100,
    maxHp: 100,
    mp: 100,
    maxMp: 100,
    level: 1,
    exp: 0,
    maxExp: 10,
    speed: 210,
    gold: 0,
    kills: 0,
    dir: 4,
    moving: false,
    damageBonus: 0,
    cooldownBonus: 0,
    areaBonus: 0,
    pickupRange: 120,
    hpRegen: 0.5,
    invulnerableTime: 0,
    shieldUntil: 0
  };

  activeSkills: ActiveSkillState[] = [];
  activePassives: ActivePassiveState[] = [];

  monsters: MonsterEntity[] = [];
  minions: MinionEntity[] = [];
  drops: DropEntity[] = [];
  damageNumbers: DamageNumber[] = [];
  effects: EffectEvent[] = [];

  upgradeChoices: Array<{
    type: 'skill' | 'passive';
    id: string;
    isNew: boolean;
    level: number;
    title: string;
    description: string;
    iconId: number;
  }> = [];

  private nextEntityId = 1;
  private listeners = new Set<() => void>();

  constructor() {
    this.resetForLobby();
  }

  setInput(ix: number, iy: number) {
    this.inputX = ix;
    this.inputY = iy;
  }

  takeEffects(): EffectEvent[] {
    const list = this.effects;
    this.effects = [];
    return list;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    this.listeners.forEach(fn => fn());
  }

  resetForLobby() {
    this.phase = 'lobby';
    this.clock = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.monsters = [];
    this.minions = [];
    this.drops = [];
    this.damageNumbers = [];
    this.effects = [];
    this.emit();
  }

  start(heroClass: HeroClass, chapterId: string) {
    this.heroClass = heroClass;
    this.chapterId = chapterId;
    this.phase = 'battle';
    this.clock = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.monsters = [];
    this.minions = [];
    this.drops = [];
    this.damageNumbers = [];
    this.activeSkills = [];
    this.activePassives = [];

    // Class specific initial stats
    if (heroClass === 'warrior') {
      this.player.maxHp = 160;
      this.player.hp = 160;
      this.player.speed = 220;
      // Start with Moon Blade (抱月刀)
      this.activeSkills.push({ id: 'moon_blade', level: 1, cdTimer: 0 });
    } else if (heroClass === 'wizard') {
      this.player.maxHp = 90;
      this.player.hp = 90;
      this.player.speed = 205;
      // Start with Dragon Purple Lightning (狂龙紫电)
      this.activeSkills.push({ id: 'dragon_purple_lightning', level: 1, cdTimer: 0 });
    } else {
      this.player.maxHp = 120;
      this.player.hp = 120;
      this.player.speed = 210;
      // Start with Enhanced Skeleton (强化骷髅术)
      this.activeSkills.push({ id: 'enhanced_skeleton', level: 1, cdTimer: 0 });
      // Spawn 1 initial skeleton minion
      this.spawnMinion('skeleton');
    }

    this.player.level = 1;
    this.player.exp = 0;
    this.player.maxExp = 8;
    this.player.gold = 0;
    this.player.kills = 0;
    this.player.x = 1000;
    this.player.y = 800;

    this.emit();
  }

  update(dt: number) {
    if (this.phase !== 'battle') return;

    this.clock += dt;
    this.waveTimer += dt;

    // Natural regeneration
    if (this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.hpRegen * dt);
    }
    if (this.player.invulnerableTime > 0) {
      this.player.invulnerableTime -= dt;
    }

    // Handle player movement
    const len = Math.hypot(this.inputX, this.inputY);
    if (len > 0.05) {
      const speed = this.player.speed * dt;
      this.player.x = Math.max(60, Math.min(1940, this.player.x + (this.inputX / len) * speed));
      this.player.y = Math.max(60, Math.min(1540, this.player.y + (this.inputY / len) * speed));
      this.player.dir = calcDirection(this.inputX, this.inputY);
      this.player.moving = true;
    } else {
      this.player.moving = false;
    }

    // Update Skills CD
    this.updateSkills(dt);

    // Update Minions
    this.updateMinions(dt);

    // Update Monster Spawns
    this.updateMonsterSpawns(dt);

    // Update Drops magnet
    this.updateDrops(dt);

    // Update Damage numbers
    this.updateDamageNumbers(dt);

    this.emit();
  }

  private updateSkills(dt: number) {
    const cooldownMultiplier = Math.max(0.3, 1 + this.player.cooldownBonus);

    for (const s of this.activeSkills) {
      s.cdTimer -= dt;
      if (s.cdTimer <= 0) {
        const def = WOOWL_SKILLS[s.id];
        if (!def) continue;

        const triggered = this.triggerSkill(s.id, s.level, def);
        if (triggered) {
          s.cdTimer = def.cooldown * cooldownMultiplier;
        } else {
          // If no enemies in range, check again soon
          s.cdTimer = 0.2;
        }
      }
    }
  }

  private triggerSkill(id: string, level: number, def: typeof WOOWL_SKILLS[string]): boolean {
    const damageMultiplier = (1 + this.player.damageBonus) * (1 + (level - 1) * 0.35);
    const areaMultiplier = (1 + this.player.areaBonus) * (1 + (level - 1) * 0.2);
    const finalDamage = Math.round(def.damage * damageMultiplier);
    const finalArea = def.area * areaMultiplier;

    if (id === 'dragon_purple_lightning') {
      // Find closest enemy
      const target = this.findNearestEnemy(this.player.x, this.player.y, def.range);
      if (!target) return false;

      // Strike main target
      this.damageEnemy(target, finalDamage, true);
      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'lightning',
        x: target.x,
        y: target.y
      });

      // Level 2+: Chain lightning to adjacent enemies
      if (level >= 2) {
        const chains = this.monsters.filter(m => m.id !== target.id && Math.hypot(m.x - target.x, m.y - target.y) <= 160).slice(0, level);
        for (const c of chains) {
          this.damageEnemy(c, Math.round(finalDamage * 0.7), false);
          this.effects.push({
            id: this.nextEntityId++,
            type: 'lightning',
            x: c.x,
            y: c.y
          });
        }
      }
      return true;
    }

    if (id === 'moon_blade') {
      // 360 degree radial slash around player
      const targets = this.monsters.filter(m => Math.hypot(m.x - this.player.x, m.y - this.player.y) <= finalArea);
      if (targets.length === 0 && this.monsters.length > 0) return false;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'blade_arc',
        x: this.player.x,
        y: this.player.y,
        radius: finalArea
      });

      for (const t of targets) {
        this.damageEnemy(t, finalDamage, true);
        // Knockback
        const angle = Math.atan2(t.y - this.player.y, t.x - this.player.x);
        t.x += Math.cos(angle) * 45;
        t.y += Math.sin(angle) * 45;
      }
      return true;
    }

    if (id === 'enhanced_skeleton') {
      // Ensure player has desired number of skeletons
      const desiredCount = level >= 2 ? 2 : 1;
      const currentCount = this.minions.filter(m => m.type === 'skeleton').length;
      if (currentCount < desiredCount) {
        this.spawnMinion('skeleton');
        sound.play(def.soundKey);
      }
      return true;
    }

    if (id === 'ghost_fire_curse') {
      // Fire homing talismans at nearest enemies
      const targets = this.findNearestEnemies(this.player.x, this.player.y, def.range, level >= 2 ? 4 : 2);
      if (targets.length === 0) return false;

      sound.play(def.soundKey);
      for (const t of targets) {
        this.damageEnemy(t, finalDamage, true);
        this.effects.push({
          id: this.nextEntityId++,
          type: 'talisman',
          x: this.player.x,
          y: this.player.y,
          targetX: t.x,
          targetY: t.y
        });
      }
      return true;
    }

    if (id === 'meteor_fire_rain') {
      const target = this.findNearestEnemy(this.player.x, this.player.y, def.range);
      if (!target) return false;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'meteor',
        x: target.x,
        y: target.y,
        radius: finalArea
      });

      // AoE damage at target center
      const inArea = this.monsters.filter(m => Math.hypot(m.x - target.x, m.y - target.y) <= finalArea);
      for (const m of inArea) {
        this.damageEnemy(m, finalDamage, true);
      }
      return true;
    }

    if (id === 'hell_thunder') {
      const inRange = this.monsters.filter(m => Math.hypot(m.x - this.player.x, m.y - this.player.y) <= finalArea);
      if (inRange.length === 0) return false;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'hell_thunder',
        x: this.player.x,
        y: this.player.y,
        radius: finalArea
      });

      for (const m of inRange) {
        this.damageEnemy(m, finalDamage, true);
      }
      return true;
    }

    if (id === 'poison_cloud') {
      const inRange = this.monsters.filter(m => Math.hypot(m.x - this.player.x, m.y - this.player.y) <= finalArea);
      if (inRange.length === 0) return false;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'poison',
        x: this.player.x,
        y: this.player.y,
        radius: finalArea
      });

      for (const m of inRange) {
        this.damageEnemy(m, finalDamage, false);
      }
      return true;
    }

    if (id === 'shinsu_summon') {
      const currentCount = this.minions.filter(m => m.type === 'shinsu').length;
      if (currentCount < 1) {
        this.spawnMinion('shinsu');
        sound.play(def.soundKey);
      }
      return true;
    }

    if (id === 'assault_dash') {
      // Dash towards facing direction
      const angle = (this.player.dir / 8) * Math.PI * 2;
      const targetX = this.player.x + Math.cos(angle) * 160;
      const targetY = this.player.y + Math.sin(angle) * 160;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'blade_arc',
        x: this.player.x,
        y: this.player.y,
        radius: 100
      });

      this.player.x = Math.max(100, Math.min(1900, targetX));
      this.player.y = Math.max(100, Math.min(1500, targetY));

      const inPath = this.monsters.filter(m => Math.hypot(m.x - this.player.x, m.y - this.player.y) <= 120);
      for (const m of inPath) {
        this.damageEnemy(m, finalDamage, true);
      }
      return true;
    }

    if (id === 'diamond_body') {
      sound.play(def.soundKey);
      this.player.shieldUntil = this.clock + 5.0;
      this.effects.push({
        id: this.nextEntityId++,
        type: 'shield',
        x: this.player.x,
        y: this.player.y,
        radius: 60
      });
      return true;
    }

    if (id === 'fire_sword') {
      const target = this.findNearestEnemy(this.player.x, this.player.y, def.range);
      if (!target) return false;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'fire_slash',
        x: target.x,
        y: target.y
      });
      this.damageEnemy(target, Math.round(finalDamage * 1.5), true);
      return true;
    }

    return false;
  }

  private updateMinions(dt: number) {
    for (const m of this.minions) {
      m.attackCd -= dt;

      // Find target if none
      if (!m.targetEnemyId || !this.monsters.some(e => e.id === m.targetEnemyId)) {
        const closest = this.findNearestEnemy(m.x, m.y, 450);
        m.targetEnemyId = closest ? closest.id : null;
      }

      const target = this.monsters.find(e => e.id === m.targetEnemyId);
      if (target) {
        const dx = target.x - m.x;
        const dy = target.y - m.y;
        const dist = Math.hypot(dx, dy);
        m.dir = calcDirection(dx, dy);

        if (dist > 50) {
          m.x += (dx / dist) * m.speed * dt;
          m.y += (dy / dist) * m.speed * dt;
        } else if (m.attackCd <= 0) {
          // Attack!
          this.damageEnemy(target, m.damage, true);
          sound.play(m.type === 'skeleton' ? 'skill_slash' : 'skill_fireball');
          m.attackCd = m.type === 'skeleton' ? 0.75 : 1.2;
        }
      } else {
        // Return to player
        const dx = this.player.x - m.x;
        const dy = this.player.y - m.y;
        const distToPlayer = Math.hypot(dx, dy);
        if (distToPlayer > 80) {
          m.dir = calcDirection(dx, dy);
          m.x += (dx / distToPlayer) * m.speed * dt;
          m.y += (dy / distToPlayer) * m.speed * dt;
        }
      }
    }
  }

  private spawnMinion(type: 'skeleton' | 'shinsu') {
    const minion: MinionEntity = {
      id: this.nextEntityId++,
      type,
      name: type === 'skeleton' ? '强化骷髅' : '神兽圣犬',
      x: this.player.x + (Math.random() - 0.5) * 60,
      y: this.player.y + (Math.random() - 0.5) * 60,
      dir: 4,
      hp: type === 'skeleton' ? 250 : 500,
      maxHp: type === 'skeleton' ? 250 : 500,
      damage: type === 'skeleton' ? 35 : 55,
      speed: type === 'skeleton' ? 240 : 200,
      targetEnemyId: null,
      attackCd: 0.5
    };
    this.minions.push(minion);
  }

  private updateMonsterSpawns(dt: number) {
    const targetMonsterCount = Math.min(60, 15 + Math.floor(this.clock / 6) * 5);

    // Spawn regular wave monsters
    if (this.monsters.length < targetMonsterCount && Math.random() < 0.35) {
      this.spawnRandomMonster();
    }

    // Spawn Boss at 90s
    if (this.clock >= 90 && !this.bossSpawned) {
      this.spawnBoss();
    }

    // Move monsters towards player
    for (const m of this.monsters) {
      const dx = this.player.x - m.x;
      const dy = this.player.y - m.y;
      const dist = Math.hypot(dx, dy);
      m.dir = calcDirection(dx, dy);
      if (dist > 25) {
        m.x += (dx / dist) * m.speed * dt;
        m.y += (dy / dist) * m.speed * dt;
      } else {
        // Attack player
        this.hitPlayer(m.damage * dt);
      }
    }
  }

  private spawnRandomMonster() {
    // Spawn around player off-screen (600-800px away)
    const angle = Math.random() * Math.PI * 2;
    const dist = 550 + Math.random() * 200;
    const x = this.player.x + Math.cos(angle) * dist;
    const y = this.player.y + Math.sin(angle) * dist;

    const types = [
      { id: 'scarecrow', name: '稻草人', hp: 45, speed: 110, damage: 12, exp: 2, radius: 24, sprite: '20112' },
      { id: 'snake', name: '剧毒蟒蛇', hp: 35, speed: 140, damage: 10, exp: 2, radius: 20, sprite: '20038' },
      { id: 'blade_hound', name: '刀犬', hp: 65, speed: 130, damage: 16, exp: 3, radius: 26, sprite: '20111' },
      { id: 'skeleton', name: '白骨骷髅', hp: 90, speed: 100, damage: 20, exp: 4, radius: 28, sprite: '20081' }
    ];

    const pick = types[Math.floor(Math.random() * types.length)];
    this.monsters.push({
      id: this.nextEntityId++,
      typeId: pick.id,
      name: pick.name,
      x,
      y,
      hp: pick.hp + Math.floor(this.clock * 0.4),
      maxHp: pick.hp + Math.floor(this.clock * 0.4),
      speed: pick.speed,
      damage: pick.damage,
      exp: pick.exp,
      radius: pick.radius,
      spriteKey: pick.sprite
    });
  }

  private spawnBoss() {
    this.bossSpawned = true;
    const angle = Math.random() * Math.PI * 2;
    const x = this.player.x + Math.cos(angle) * 500;
    const y = this.player.y + Math.sin(angle) * 500;

    const chap = WOOWL_CHAPTERS[this.chapterId] || WOOWL_CHAPTERS.sunset_island;
    this.monsters.push({
      id: this.nextEntityId++,
      typeId: 'boss',
      name: chap.bossName,
      x,
      y,
      hp: 1800,
      maxHp: 1800,
      speed: 115,
      damage: 32,
      exp: 50,
      radius: 48,
      isBoss: true,
      spriteKey: '20082' // Enhanced skeleton boss model
    });

    this.addDamageNumber(x, y, `【${chap.bossName} 降临！】`, '#ff3333', true);
  }

  private hitPlayer(dmg: number) {
    if (this.player.invulnerableTime > 0) return;

    let finalDmg = dmg;
    if (this.clock < this.player.shieldUntil) {
      finalDmg *= 0.5; // Shield reduction
    }

    this.player.hp -= finalDmg;
    sound.play('player_hurt', 0.4);

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.phase = 'game_over';
      sound.play('player_die');
    }
  }

  damageEnemy(m: MonsterEntity, dmg: number, crit = false) {
    m.hp -= dmg;
    this.addDamageNumber(m.x, m.y, `${dmg}`, crit ? '#ffdd00' : '#ffffff', crit);
    sound.play('monster_hurt', 0.25);

    if (m.hp <= 0) {
      this.killEnemy(m);
    }
  }

  private killEnemy(m: MonsterEntity) {
    this.monsters = this.monsters.filter(e => e.id !== m.id);
    this.player.kills++;
    sound.play('monster_die', 0.3);

    // Drop Exp crystal
    this.drops.push({
      id: this.nextEntityId++,
      type: 'exp',
      x: m.x,
      y: m.y,
      value: m.exp
    });

    // Chance to drop potion or gold
    if (Math.random() < 0.15) {
      this.drops.push({
        id: this.nextEntityId++,
        type: Math.random() < 0.5 ? 'gold' : 'potion',
        x: m.x + (Math.random() - 0.5) * 20,
        y: m.y + (Math.random() - 0.5) * 20,
        value: 10
      });
    }

    if (m.isBoss) {
      this.bossDefeated = true;
      this.phase = 'victory';
    }
  }

  private updateDrops(dt: number) {
    const pickupDist = this.player.pickupRange;

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i];
      const dist = Math.hypot(this.player.x - d.x, this.player.y - d.y);

      if (dist <= pickupDist) {
        // Fly towards player
        const angle = Math.atan2(this.player.y - d.y, this.player.x - d.x);
        const flySpeed = 450;
        d.x += Math.cos(angle) * flySpeed * dt;
        d.y += Math.sin(angle) * flySpeed * dt;

        if (dist <= 30) {
          // Collected!
          if (d.type === 'exp') {
            this.gainExp(d.value);
            sound.play('coin', 0.3);
          } else if (d.type === 'gold') {
            this.player.gold += d.value;
            sound.play('coin', 0.4);
          } else if (d.type === 'potion') {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
            sound.play('potion', 0.5);
            this.addDamageNumber(this.player.x, this.player.y, '+40 HP', '#44ff44');
          }
          this.drops.splice(i, 1);
        }
      }
    }
  }

  private gainExp(amount: number) {
    this.player.exp += amount;
    if (this.player.exp >= this.player.maxExp) {
      this.player.exp -= this.player.maxExp;
      this.player.level++;
      this.player.maxExp = Math.round(this.player.maxExp * 1.5 + 4);
      this.player.maxHp += 15;
      this.player.hp = this.player.maxHp;

      sound.play('skill_holyword');
      this.addDamageNumber(this.player.x, this.player.y, 'LEVEL UP!', '#ffe066', true);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'level_up',
        x: this.player.x,
        y: this.player.y
      });
      this.triggerLevelUp();
    }
  }

  private triggerLevelUp() {
    this.phase = 'level_up';
    this.upgradeChoices = this.generateUpgradeChoices();
    this.emit();
  }

  private generateUpgradeChoices() {
    const choices: typeof this.upgradeChoices = [];
    const availableSkills = Object.values(WOOWL_SKILLS).filter(s => s.classType === this.heroClass || s.classType === 'all');

    // 1. Existing skills that can upgrade
    for (const act of this.activeSkills) {
      const def = WOOWL_SKILLS[act.id];
      if (def && act.level < def.maxLevel) {
        const nextUpgrade = def.upgrades.find(u => u.level === act.level + 1);
        choices.push({
          type: 'skill',
          id: act.id,
          isNew: false,
          level: act.level + 1,
          title: `${def.name} · Lv.${act.level + 1}`,
          description: nextUpgrade ? `${nextUpgrade.title}: ${nextUpgrade.description}` : def.desc,
          iconId: def.iconId
        });
      }
    }

    // 2. New skills
    if (this.activeSkills.length < 5) {
      const unownedSkills = availableSkills.filter(s => !this.activeSkills.some(a => a.id === s.id));
      for (const s of unownedSkills) {
        choices.push({
          type: 'skill',
          id: s.id,
          isNew: true,
          level: 1,
          title: `习得新招: 【${s.name}】`,
          description: s.desc,
          iconId: s.iconId
        });
      }
    }

    // 3. Passives
    const allPassives = Object.values(WOOWL_PASSIVES);
    for (const p of allPassives) {
      const existing = this.activePassives.find(a => a.id === p.id);
      const curLevel = existing ? existing.level : 0;
      if (curLevel < p.maxLevel) {
        choices.push({
          type: 'passive',
          id: p.id,
          isNew: curLevel === 0,
          level: curLevel + 1,
          title: `宝物: 【${p.name}】Lv.${curLevel + 1}`,
          description: p.desc,
          iconId: p.iconId
        });
      }
    }

    // Shuffle and pick 3
    const shuffled = choices.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  selectUpgrade(choice: typeof this.upgradeChoices[0]) {
    sound.play('ui_click');

    if (choice.type === 'skill') {
      const existing = this.activeSkills.find(s => s.id === choice.id);
      if (existing) {
        existing.level = choice.level;
      } else {
        this.activeSkills.push({ id: choice.id, level: choice.level, cdTimer: 0 });
      }
    } else {
      const existing = this.activePassives.find(p => p.id === choice.id);
      if (existing) {
        existing.level = choice.level;
      } else {
        this.activePassives.push({ id: choice.id, level: choice.level });
      }
      this.applyPassiveEffects();
    }

    this.phase = 'battle';
    this.emit();
  }

  private applyPassiveEffects() {
    this.player.damageBonus = 0;
    this.player.speed = this.heroClass === 'warrior' ? 220 : this.heroClass === 'wizard' ? 205 : 210;
    this.player.cooldownBonus = 0;
    this.player.areaBonus = 0;
    this.player.pickupRange = 120;
    this.player.hpRegen = 0.5;

    for (const p of this.activePassives) {
      const def = WOOWL_PASSIVES[p.id];
      if (!def) continue;
      const lvl = p.level;

      if (def.effect.damageMod) this.player.damageBonus += def.effect.damageMod * lvl;
      if (def.effect.speedMod) this.player.speed *= (1 + def.effect.speedMod * lvl);
      if (def.effect.cooldownMod) this.player.cooldownBonus += def.effect.cooldownMod * lvl;
      if (def.effect.areaMod) this.player.areaBonus += def.effect.areaMod * lvl;
      if (def.effect.pickupRangeMod) this.player.pickupRange *= (1 + def.effect.pickupRangeMod * lvl);
      if (def.effect.hpRegen) this.player.hpRegen += def.effect.hpRegen * lvl;
    }
  }

  private addDamageNumber(x: number, y: number, text: string, color: string, crit = false) {
    this.damageNumbers.push({
      id: this.nextEntityId++,
      x,
      y: y - 10,
      text,
      color,
      crit,
      life: 0.8
    });
  }

  private updateDamageNumbers(dt: number) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y -= 35 * dt;
      d.life -= dt;
      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  private findNearestEnemy(x: number, y: number, maxRange: number): MonsterEntity | null {
    let bestDist = maxRange;
    let bestEnemy: MonsterEntity | null = null;
    for (const m of this.monsters) {
      const d = Math.hypot(m.x - x, m.y - y);
      if (d <= bestDist) {
        bestDist = d;
        bestEnemy = m;
      }
    }
    return bestEnemy;
  }

  private findNearestEnemies(x: number, y: number, maxRange: number, count: number): MonsterEntity[] {
    return this.monsters
      .map(m => ({ m, dist: Math.hypot(m.x - x, m.y - y) }))
      .filter(item => item.dist <= maxRange)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, count)
      .map(item => item.m);
  }
}

export const game = new GameEngine();
if (typeof window !== 'undefined') {
  (window as any).game = game;
}
