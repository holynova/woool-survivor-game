import type {
  HeroClass,
  GamePhase,
  DifficultyCurveId,
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
import {
  WOOWL_MONSTERS,
  WOOWL_DIFFICULTY_CURVES,
  evaluateCurveState
} from './config/curves';
import { sound } from './audio';

export const WORLD_WIDTH = 2752;
export const WORLD_HEIGHT = 1536;

export function calcDirection(dx: number, dy: number): number {
  const angle = Math.atan2(dy, dx);
  const octant = Math.round((angle + Math.PI / 2) / (Math.PI / 4));
  return (octant % 8 + 8) % 8;
}

export class GameEngine {
  phase: GamePhase = 'lobby';
  heroClass: HeroClass = 'wizard';
  chapterId = 'sunset_island';
  difficultyId: DifficultyCurveId = 'standard';

  clock = 0;
  wave = 1;
  wavePhaseName = '发育起势';
  waveProgress = 0;
  waveTimer = 0;
  bossSpawned = false;
  bossDefeated = false;

  private eliteTimer = 0;
  private spawnAccumulator = 0;
  private statusTickTimer = 0;
  private shieldReduction = 0.4;
  private thornRatio = 0;

  inputX = 0;
  inputY = 0;

  player: PlayerState = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    hp: 155,
    maxHp: 155,
    mp: 100,
    maxMp: 100,
    level: 1,
    exp: 0,
    maxExp: 6,
    speed: 212,
    gold: 0,
    kills: 0,
    dir: 4,
    moving: false,
    damageBonus: 0,
    cooldownBonus: 0,
    areaBonus: 0,
    pickupRange: 130,
    hpRegen: 0.6,
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

  version = 0;
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
    this.version++;
    this.listeners.forEach(fn => fn());
  }

  resetForLobby() {
    this.phase = 'lobby';
    this.clock = 0;
    this.wave = 1;
    this.wavePhaseName = '发育起势';
    this.waveProgress = 0;
    this.waveTimer = 0;
    this.eliteTimer = 0;
    this.spawnAccumulator = 0;
    this.statusTickTimer = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.monsters = [];
    this.minions = [];
    this.drops = [];
    this.damageNumbers = [];
    this.effects = [];
    this.emit();
  }

  start(heroClass: HeroClass, chapterId: string, difficultyId?: DifficultyCurveId) {
    this.heroClass = heroClass;
    this.chapterId = chapterId;
    if (difficultyId) {
      this.difficultyId = difficultyId;
    }

    this.phase = 'battle';
    this.clock = 0;
    this.wave = 1;
    this.wavePhaseName = '发育起势';
    this.waveProgress = 0;
    this.waveTimer = 0;
    this.eliteTimer = 0;
    this.spawnAccumulator = 0;
    this.statusTickTimer = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.monsters = [];
    this.minions = [];
    this.drops = [];
    this.damageNumbers = [];
    this.effects = [];
    this.activeSkills = [];
    this.activePassives = [];
    this.shieldReduction = 0.4;
    this.thornRatio = 0;

    if (heroClass === 'warrior') {
      this.player.maxHp = 240;
      this.player.hp = 240;
      this.activeSkills.push({ id: 'moon_blade', level: 1, cdTimer: 0 });
    } else if (heroClass === 'wizard') {
      this.player.maxHp = 155;
      this.player.hp = 155;
      this.activeSkills.push({ id: 'dragon_purple_lightning', level: 1, cdTimer: 0 });
    } else {
      this.player.maxHp = 190;
      this.player.hp = 190;
      this.activeSkills.push({ id: 'enhanced_skeleton', level: 1, cdTimer: 0 });
      this.activeSkills.push({ id: 'ghost_fire_curse', level: 1, cdTimer: 0.4 });
      this.spawnMinion('skeleton', 1);
    }

    this.player.level = 1;
    this.applyPassiveEffects();
    this.player.hp = this.player.maxHp;
    this.player.exp = 0;
    this.player.maxExp = 8;
    this.player.gold = 0;
    this.player.kills = 0;
    this.player.x = WORLD_WIDTH / 2;
    this.player.y = WORLD_HEIGHT / 2;
    this.player.invulnerableTime = 1.0;
    this.player.shieldUntil = 0;

    // Seed immediate vanguard monsters outside comfortable spawn ring
    for (let i = 0; i < 6; i++) {
      this.spawnMonsterFromChapter(false, 370 + Math.random() * 140);
    }

    this.emit();
  }

  getActiveBoss(): MonsterEntity | undefined {
    return this.monsters.find(m => m.isBoss);
  }

  getBossTriggerTime(): number {
    const chap = WOOWL_CHAPTERS[this.chapterId] || WOOWL_CHAPTERS.sunset_island;
    const curve = WOOWL_DIFFICULTY_CURVES[this.difficultyId] || WOOWL_DIFFICULTY_CURVES.standard;
    return Math.round(chap.durationSeconds * curve.bossTimeScale);
  }

  update(dt: number) {
    if (this.phase !== 'battle') return;

    const clampedDt = Math.min(dt, 0.1);
    this.clock += clampedDt;
    this.waveTimer += clampedDt;

    if (this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.hpRegen * clampedDt);
    }
    if (this.player.invulnerableTime > 0) {
      this.player.invulnerableTime -= clampedDt;
    }

    const len = Math.hypot(this.inputX, this.inputY);
    if (len > 0.05) {
      const step = this.player.speed * clampedDt;
      this.player.x = Math.max(80, Math.min(WORLD_WIDTH - 80, this.player.x + (this.inputX / len) * step));
      this.player.y = Math.max(80, Math.min(WORLD_HEIGHT - 80, this.player.y + (this.inputY / len) * step));
      this.player.dir = calcDirection(this.inputX, this.inputY);
      this.player.moving = true;
    } else {
      this.player.moving = false;
    }

    this.updateSkills(clampedDt);
    this.updateMinions(clampedDt);
    this.updateMonsterSpawns(clampedDt);
    this.updateMonsterStatuses(clampedDt);
    this.updateDrops(clampedDt);
    this.updateDamageNumbers(clampedDt);

    this.emit();
  }

  private updateSkills(dt: number) {
    const curve = WOOWL_DIFFICULTY_CURVES[this.difficultyId] || WOOWL_DIFFICULTY_CURVES.standard;
    const baseCdMult = Math.max(0.32, (1 + this.player.cooldownBonus) * curve.cdMult);

    for (const s of this.activeSkills) {
      s.cdTimer -= dt;
      if (s.cdTimer <= 0) {
        const def = WOOWL_SKILLS[s.id];
        if (!def) continue;

        const triggered = this.triggerSkill(s.id, s.level, def);
        if (triggered) {
          let levelCdMod = 1.0 - (s.level - 1) * 0.06;
          if (s.id === 'moon_blade' && s.level >= 4) levelCdMod *= 0.72;
          if (s.id === 'hell_thunder' && s.level >= 2) levelCdMod *= 0.82;
          s.cdTimer = Math.max(0.35, def.cooldown * baseCdMult * levelCdMod);
        } else {
          s.cdTimer = 0.18;
        }
      }
    }
  }

  private triggerSkill(id: string, level: number, def: typeof WOOWL_SKILLS[string]): boolean {
    const damageMultiplier = (1 + this.player.damageBonus) * (1 + (level - 1) * 0.36);
    const areaMultiplier = (1 + this.player.areaBonus) * (1 + (level - 1) * 0.18);
    const finalDamage = Math.round(def.damage * damageMultiplier);
    const finalArea = def.area * areaMultiplier;

    if (id === 'dragon_purple_lightning') {
      const boltCount = level >= 4 ? 3 : level >= 3 ? 2 : 1;
      const targets = this.findNearestEnemies(this.player.x, this.player.y, def.range, boltCount);
      if (targets.length === 0) return false;

      sound.play(def.soundKey);
      const hitIds = new Set<number>();

      for (const mainTarget of targets) {
        if (mainTarget.hp <= 0) continue;
        hitIds.add(mainTarget.id);
        this.damageEnemy(mainTarget, finalDamage, true);
        if (level >= 3) {
          mainTarget.stunUntil = Math.max(mainTarget.stunUntil || 0, this.clock + 0.8);
        }
        this.effects.push({
          id: this.nextEntityId++,
          type: 'lightning',
          x: mainTarget.x,
          y: mainTarget.y
        });

        // Localized electric shockwave around impact point
        const shockSplash = this.monsters.filter(
          m => !hitIds.has(m.id) && m.hp > 0 && Math.hypot(m.x - mainTarget.x, m.y - mainTarget.y) <= finalArea * 0.85
        );
        for (const sMob of shockSplash) {
          hitIds.add(sMob.id);
          this.damageEnemy(sMob, Math.round(finalDamage * 0.65), false);
        }

        // Chain lightning arcs to adjacent targets
        const chainMax = level >= 4 ? 4 : level >= 2 ? 3 : 2;
        const chains = this.monsters
          .filter(m => !hitIds.has(m.id) && m.hp > 0 && Math.hypot(m.x - mainTarget.x, m.y - mainTarget.y) <= (level >= 4 ? 230 : 185))
          .slice(0, chainMax);

        for (const c of chains) {
          hitIds.add(c.id);
          const dmgRatio = level >= 4 ? 0.88 : 0.72;
          this.damageEnemy(c, Math.round(finalDamage * dmgRatio), level >= 4);
          if (level >= 3) {
            c.stunUntil = Math.max(c.stunUntil || 0, this.clock + 0.5);
          }
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
      const reach = finalArea * (level >= 3 ? 1.2 : 1.0);
      const targets = this.monsters.filter(m => Math.hypot(m.x - this.player.x, m.y - this.player.y) <= reach);
      if (targets.length === 0) return false;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'blade_arc',
        x: this.player.x,
        y: this.player.y,
        radius: reach
      });

      const knockbackDist = level >= 2 ? 75 : 52;
      for (const t of targets) {
        this.damageEnemy(t, finalDamage, true);
        const angle = Math.atan2(t.y - this.player.y, t.x - this.player.x);
        const push = t.isBoss ? knockbackDist * 0.25 : knockbackDist;
        t.x = Math.max(80, Math.min(WORLD_WIDTH - 80, t.x + Math.cos(angle) * push));
        t.y = Math.max(80, Math.min(WORLD_HEIGHT - 80, t.y + Math.sin(angle) * push));
      }
      return true;
    }

    if (id === 'enhanced_skeleton') {
      const desiredCount = level >= 4 ? 3 : level >= 2 ? 2 : 1;
      const currentSkeletons = this.minions.filter(m => m.type === 'skeleton');
      if (currentSkeletons.length < desiredCount) {
        this.spawnMinion('skeleton', level);
        sound.play(def.soundKey);
      }
      for (const m of currentSkeletons) {
        m.damage = Math.round(35 * (1 + (level - 1) * 0.38));
        m.speed = level >= 2 ? 290 : 245;
      }
      return true;
    }

    if (id === 'ghost_fire_curse') {
      const talismanCount = level >= 4 ? 7 : level === 3 ? 5 : level === 2 ? 4 : 3;
      const targets = this.findNearestEnemies(this.player.x, this.player.y, def.range, talismanCount);
      if (targets.length === 0) return false;

      sound.play(def.soundKey);
      for (const t of targets) {
        if (t.hp <= 0) continue;
        this.damageEnemy(t, finalDamage, level >= 4);
        if (level >= 3) {
          t.slowUntil = Math.max(t.slowUntil || 0, this.clock + 1.5);
        }
        const splashRadius = level >= 2 ? 78 : 62;
        for (const adj of this.monsters) {
          if (adj.id !== t.id && adj.hp > 0 && Math.hypot(adj.x - t.x, adj.y - t.y) <= splashRadius) {
            this.damageEnemy(adj, Math.round(finalDamage * 0.62), false);
          }
        }
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
      const meteorCount = level >= 4 ? 5 : level >= 2 ? 3 : 2;
      const candidates = this.findNearestEnemies(this.player.x, this.player.y, def.range, meteorCount);
      if (candidates.length === 0) return false;

      sound.play(def.soundKey);
      for (let i = 0; i < meteorCount; i++) {
        const anchor = candidates[i % candidates.length];
        if (!anchor) continue;
        const impactX = anchor.x + (i > 0 ? (Math.random() - 0.5) * 90 : 0);
        const impactY = anchor.y + (i > 0 ? (Math.random() - 0.5) * 90 : 0);
        this.effects.push({
          id: this.nextEntityId++,
          type: 'meteor',
          x: impactX,
          y: impactY,
          radius: finalArea
        });

        const inArea = this.monsters.filter(m => Math.hypot(m.x - impactX, m.y - impactY) <= finalArea);
        for (const m of inArea) {
          this.damageEnemy(m, finalDamage, true);
          if (level >= 3) {
            m.slowUntil = Math.max(m.slowUntil || 0, this.clock + 2.5);
            m.burnUntil = Math.max(m.burnUntil || 0, this.clock + 3.0);
            m.burnDps = Math.max(m.burnDps || 0, Math.round(finalDamage * 0.35));
          }
        }
      }
      return true;
    }

    if (id === 'hell_thunder') {
      const reach = finalArea * (level >= 4 ? 1.35 : level >= 2 ? 1.18 : 1.0);
      const inRange = this.monsters.filter(m => Math.hypot(m.x - this.player.x, m.y - this.player.y) <= reach);
      if (inRange.length === 0) return false;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'hell_thunder',
        x: this.player.x,
        y: this.player.y,
        radius: reach
      });

      const hits = level >= 3 ? 2 : 1;
      for (const m of inRange) {
        if (level >= 4) m.armorBreak = Math.max(m.armorBreak || 0, 0.35);
        this.damageEnemy(m, Math.round(finalDamage * (hits === 2 ? 1.45 : 1.0)), true);
        if (m.hp > 0) {
          const angle = Math.atan2(m.y - this.player.y, m.x - this.player.x);
          const push = m.isBoss ? 25 : level >= 3 ? 95 : 65;
          m.x = Math.max(80, Math.min(WORLD_WIDTH - 80, m.x + Math.cos(angle) * push));
          m.y = Math.max(80, Math.min(WORLD_HEIGHT - 80, m.y + Math.sin(angle) * push));
        }
      }
      return true;
    }

    if (id === 'poison_cloud') {
      const target = this.findNearestEnemy(this.player.x, this.player.y, def.range);
      if (!target) return false;

      const cloudRadius = finalArea * (level >= 2 ? 1.25 : 1.0);
      const inRange = this.monsters.filter(m => Math.hypot(m.x - target.x, m.y - target.y) <= cloudRadius);
      if (inRange.length === 0) return false;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'poison',
        x: target.x,
        y: target.y,
        radius: cloudRadius
      });

      for (const m of inRange) {
        m.poisonUntil = Math.max(m.poisonUntil || 0, this.clock + (level >= 2 ? 6.0 : 4.0));
        m.poisonDps = Math.max(m.poisonDps || 0, Math.round(finalDamage * 0.85));
        m.armorBreak = Math.max(m.armorBreak || 0, level >= 4 ? 0.45 : 0.2);
        if (level >= 4) {
          m.slowUntil = Math.max(m.slowUntil || 0, this.clock + 4.0);
        }
        this.damageEnemy(m, finalDamage, false);
      }
      return true;
    }

    if (id === 'shinsu_summon') {
      const desired = level >= 4 ? 2 : 1;
      const existing = this.minions.filter(m => m.type === 'shinsu');
      if (existing.length < desired) {
        this.spawnMinion('shinsu', level);
        sound.play(def.soundKey);
      }
      for (const m of existing) {
        m.damage = Math.round(58 * (1 + (level - 1) * 0.35));
      }
      return true;
    }

    if (id === 'assault_dash') {
      const dashDist = level >= 2 ? 210 : 165;
      const angle = (this.player.dir / 8) * Math.PI * 2;
      const targetX = this.player.x + Math.cos(angle) * dashDist;
      const targetY = this.player.y + Math.sin(angle) * dashDist;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'dash',
        x: this.player.x,
        y: this.player.y,
        radius: 110
      });

      this.player.x = Math.max(80, Math.min(WORLD_WIDTH - 80, targetX));
      this.player.y = Math.max(80, Math.min(WORLD_HEIGHT - 80, targetY));
      this.player.invulnerableTime = Math.max(this.player.invulnerableTime, level >= 4 ? 0.7 : 0.4);

      const impactR = level >= 3 ? 160 : 125;
      const inPath = this.monsters.filter(m => Math.hypot(m.x - this.player.x, m.y - this.player.y) <= impactR);
      for (const m of inPath) {
        m.stunUntil = Math.max(m.stunUntil || 0, this.clock + 0.7);
        this.damageEnemy(m, Math.round(finalDamage * (level >= 4 ? 1.45 : 1.0)), true);
      }
      return true;
    }

    if (id === 'diamond_body') {
      sound.play(def.soundKey);
      this.player.shieldUntil = this.clock + 4.5 + (level - 1) * 0.9;
      this.shieldReduction = Math.min(0.68, 0.38 + (level - 1) * 0.08);
      this.thornRatio = level >= 2 ? 0.55 : 0;
      this.effects.push({
        id: this.nextEntityId++,
        type: 'diamond_body',
        x: this.player.x,
        y: this.player.y,
        radius: 65
      });
      return true;
    }

    if (id === 'wind_shield') {
      sound.play(def.soundKey);
      this.player.shieldUntil = this.clock + 5.5 + (level - 1) * 0.8;
      this.shieldReduction = Math.max(this.shieldReduction, 0.22 + (level - 1) * 0.08);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'wind_shield',
        x: this.player.x,
        y: this.player.y,
        radius: finalArea
      });
      const nearby = this.monsters.filter(m => Math.hypot(m.x - this.player.x, m.y - this.player.y) <= finalArea);
      for (const m of nearby) {
        this.damageEnemy(m, finalDamage, false);
        const angle = Math.atan2(m.y - this.player.y, m.x - this.player.x);
        const push = m.isBoss ? 25 : 85;
        m.x = Math.max(80, Math.min(WORLD_WIDTH - 80, m.x + Math.cos(angle) * push));
        m.y = Math.max(80, Math.min(WORLD_HEIGHT - 80, m.y + Math.sin(angle) * push));
      }
      return true;
    }

    if (id === 'fire_sword') {
      const target = this.findNearestEnemy(this.player.x, this.player.y, def.range + (level >= 3 ? 50 : 0));
      if (!target) return false;

      sound.play(def.soundKey);
      this.effects.push({
        id: this.nextEntityId++,
        type: 'fire_slash',
        x: target.x,
        y: target.y
      });

      const burstMult = level >= 4 ? 1.8 : 1.45;
      const cleaveR = level >= 3 ? 115 : 80;
      const hitList = this.monsters.filter(m => Math.hypot(m.x - target.x, m.y - target.y) <= cleaveR);
      for (const m of hitList) {
        this.damageEnemy(m, Math.round(finalDamage * burstMult), true);
        if (level >= 2) {
          m.burnUntil = Math.max(m.burnUntil || 0, this.clock + 3.0);
          m.burnDps = Math.max(m.burnDps || 0, Math.round(finalDamage * 0.45));
        }
      }
      return true;
    }

    return false;
  }

  private updateMinions(dt: number) {
    for (const m of this.minions) {
      m.attackCd -= dt;

      if (!m.targetEnemyId || !this.monsters.some(e => e.id === m.targetEnemyId)) {
        const closest = this.findNearestEnemy(m.x, m.y, 500);
        m.targetEnemyId = closest ? closest.id : null;
      }

      const target = this.monsters.find(e => e.id === m.targetEnemyId);
      if (target) {
        const dx = target.x - m.x;
        const dy = target.y - m.y;
        const dist = Math.hypot(dx, dy);
        m.dir = calcDirection(dx, dy);

        if (dist > 54) {
          m.x += (dx / dist) * m.speed * dt;
          m.y += (dy / dist) * m.speed * dt;
        } else if (m.attackCd <= 0) {
          this.damageEnemy(target, m.damage, true);
          const cleaveR = m.type === 'shinsu' ? 95 : 65;
          for (const adj of this.monsters) {
            if (adj.id !== target.id && adj.hp > 0 && Math.hypot(adj.x - target.x, adj.y - target.y) <= cleaveR) {
              this.damageEnemy(adj, Math.round(m.damage * 0.7), false);
            }
          }
          sound.play(m.type === 'skeleton' ? 'skill_slash' : 'skill_fireball');
          this.effects.push({
            id: this.nextEntityId++,
            type: m.type === 'skeleton' ? 'skeleton' : 'shinsu',
            x: target.x,
            y: target.y
          });
          m.attackCd = m.type === 'skeleton' ? 0.58 : 0.9;
        }
      } else {
        const dx = this.player.x - m.x;
        const dy = this.player.y - m.y;
        const distToPlayer = Math.hypot(dx, dy);
        if (distToPlayer > 85) {
          m.dir = calcDirection(dx, dy);
          m.x += (dx / distToPlayer) * m.speed * dt;
          m.y += (dy / distToPlayer) * m.speed * dt;
        }
      }
    }
  }

  private spawnMinion(type: 'skeleton' | 'shinsu', level = 1) {
    const minion: MinionEntity = {
      id: this.nextEntityId++,
      type,
      name: type === 'skeleton' ? '强化骷髅' : '神兽圣犬',
      x: this.player.x + (Math.random() - 0.5) * 65,
      y: this.player.y + (Math.random() - 0.5) * 65,
      dir: 4,
      hp: type === 'skeleton' ? 280 : 580,
      maxHp: type === 'skeleton' ? 280 : 580,
      damage: Math.round((type === 'skeleton' ? 35 : 58) * (1 + (level - 1) * 0.35)),
      speed: type === 'skeleton' ? 245 : 210,
      targetEnemyId: null,
      attackCd: 0.45
    };
    this.minions.push(minion);
  }

  private updateMonsterSpawns(dt: number) {
    const chap = WOOWL_CHAPTERS[this.chapterId] || WOOWL_CHAPTERS.sunset_island;
    const curve = WOOWL_DIFFICULTY_CURVES[this.difficultyId] || WOOWL_DIFFICULTY_CURVES.standard;
    const bossTime = this.getBossTriggerTime();

    const state = evaluateCurveState(this.difficultyId, chap.chapterDifficulty, this.clock, bossTime);
    this.wave = state.phaseIndex;
    this.wavePhaseName = state.phaseName;
    this.waveProgress = Math.min(1, state.progress);

    // Accumulator-based smooth spawning
    this.spawnAccumulator += state.spawnChancePerSec * dt;
    while (this.spawnAccumulator >= 1) {
      this.spawnAccumulator -= 1;
      if (this.monsters.length < state.targetCount) {
        this.spawnMonsterFromChapter(false);
      }
    }

    // Periodic Elite Spawn
    this.eliteTimer += dt;
    if (this.eliteTimer >= curve.eliteInterval) {
      this.eliteTimer = 0;
      const eliteCount = this.difficultyId === 'hell' || state.progress > 0.65 ? 2 : 1;
      for (let i = 0; i < eliteCount; i++) {
        this.spawnMonsterFromChapter(true);
      }
    }

    // Chapter Boss Arrival
    if (this.clock >= bossTime && !this.bossSpawned) {
      this.spawnBoss();
    }

    // Move monsters & handle Boss surge & melee hits
    const meleeAttackers: MonsterEntity[] = [];
    for (const m of this.monsters) {
      if (m.stunUntil && this.clock < m.stunUntil) {
        continue;
      }

      const dx = this.player.x - m.x;
      const dy = this.player.y - m.y;
      const dist = Math.hypot(dx, dy);
      m.dir = calcDirection(dx, dy);

      let moveSpeed = m.speed;
      if (m.slowUntil && this.clock < m.slowUntil) {
        moveSpeed *= 0.55;
      }

      // Boss fierce surge every 5-6s
      if (m.isBoss && dist > 90 && dist < 440) {
        m.dashCd = (m.dashCd ?? 5.0) - dt;
        if (m.dashCd <= 0) {
          m.dashCd = this.difficultyId === 'hell' ? 4.2 : 5.8;
          moveSpeed *= 3.0;
          this.addDamageNumber(m.x, m.y - 30, '狂暴突袭!', '#ff5252', true);
        }
      }

      if (dist > m.radius + 14) {
        m.x = Math.max(70, Math.min(WORLD_WIDTH - 70, m.x + (dx / dist) * moveSpeed * dt));
        m.y = Math.max(70, Math.min(WORLD_HEIGHT - 70, m.y + (dy / dist) * moveSpeed * dt));
      } else {
        meleeAttackers.push(m);
      }
    }

    if (meleeAttackers.length > 0 && this.player.invulnerableTime <= 0) {
      const lead = meleeAttackers.reduce((best, cur) => (cur.damage > best.damage ? cur : best), meleeAttackers[0]);
      const swarmMult = 1 + Math.min(1.4, (meleeAttackers.length - 1) * 0.30);
      const hitChunk = Math.max(4, Math.round(lead.damage * 0.36 * swarmMult));
      this.hitPlayer(hitChunk, lead);
    }
  }

  private pickMonsterFromPool(progress: number): string {
    const chap = WOOWL_CHAPTERS[this.chapterId] || WOOWL_CHAPTERS.sunset_island;
    const weightedPool = chap.monsterPool.map(item => {
      let w = item.weight;
      if (progress < 0.22 && (item.typeId === 'shinsu_puppet' || item.typeId === 'enhanced_skeleton')) {
        w = Math.max(2, Math.round(w * 0.2));
      } else if (progress >= 0.6 && (item.typeId === 'shinsu_puppet' || item.typeId === 'enhanced_skeleton')) {
        w = Math.round(w * 1.45);
      }
      return { typeId: item.typeId, weight: w };
    });

    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * totalWeight;
    for (const item of weightedPool) {
      r -= item.weight;
      if (r <= 0) return item.typeId;
    }
    return weightedPool[0]?.typeId || 'scarecrow';
  }

  private spawnMonsterFromChapter(isElite = false, customDist?: number) {
    const chap = WOOWL_CHAPTERS[this.chapterId] || WOOWL_CHAPTERS.sunset_island;
    const curve = WOOWL_DIFFICULTY_CURVES[this.difficultyId] || WOOWL_DIFFICULTY_CURVES.standard;
    const bossTime = this.getBossTriggerTime();
    const state = evaluateCurveState(this.difficultyId, chap.chapterDifficulty, this.clock, bossTime);

    const angle = Math.random() * Math.PI * 2;
    const dist = customDist ?? (520 + Math.random() * 220);
    const x = Math.max(80, Math.min(WORLD_WIDTH - 80, this.player.x + Math.cos(angle) * dist));
    const y = Math.max(80, Math.min(WORLD_HEIGHT - 80, this.player.y + Math.sin(angle) * dist));

    const pickedType = isElite
      ? (Math.random() < 0.5 ? 'enhanced_skeleton' : this.pickMonsterFromPool(state.progress))
      : this.pickMonsterFromPool(state.progress);
    const arch = WOOWL_MONSTERS[pickedType] || WOOWL_MONSTERS.scarecrow;

    const eliteHpMult = isElite ? 3.2 : 1.0;
    const eliteDmgMult = isElite ? 1.35 : 1.0;
    const eliteSpeedMult = isElite ? 1.12 : 1.0;

    const finalHp = Math.max(12, Math.round(arch.hp * state.hpMult * eliteHpMult));
    const finalDmg = Math.max(5, Math.round(arch.damage * state.dmgMult * eliteDmgMult));
    const finalSpeed = Math.round(arch.speed * state.speedMult * eliteSpeedMult);
    const finalExp = Math.max(1, Math.round((arch.exp * (isElite ? 4 : 1) + state.expBonusFlat) * curve.expMult));

    this.monsters.push({
      id: this.nextEntityId++,
      typeId: arch.id,
      name: isElite ? `【精英】${arch.name}` : arch.name,
      x,
      y,
      hp: finalHp,
      maxHp: finalHp,
      speed: finalSpeed,
      damage: finalDmg,
      exp: finalExp,
      radius: isElite ? Math.round(arch.radius * 1.2) : arch.radius,
      isElite,
      spriteKey: arch.spriteKey
    });

    if (isElite) {
      this.addDamageNumber(x, y - 20, `【精英 ${arch.name} 来袭】`, '#c084fc', true);
    }
  }

  private spawnBoss() {
    this.bossSpawned = true;
    const chap = WOOWL_CHAPTERS[this.chapterId] || WOOWL_CHAPTERS.sunset_island;
    const curve = WOOWL_DIFFICULTY_CURVES[this.difficultyId] || WOOWL_DIFFICULTY_CURVES.standard;

    const angle = Math.random() * Math.PI * 2;
    const x = Math.max(140, Math.min(WORLD_WIDTH - 140, this.player.x + Math.cos(angle) * 480));
    const y = Math.max(140, Math.min(WORLD_HEIGHT - 140, this.player.y + Math.sin(angle) * 480));

    const hp = Math.round(chap.bossHp * curve.bossHpMult);
    const dmg = Math.round(chap.bossDamage * curve.bossDmgMult);

    this.monsters.push({
      id: this.nextEntityId++,
      typeId: 'boss',
      name: chap.bossName,
      x,
      y,
      hp,
      maxHp: hp,
      speed: Math.round(122 * curve.speedMult),
      damage: dmg,
      exp: 60,
      radius: 48,
      isBoss: true,
      dashCd: 4.0,
      spriteKey: chap.bossSpriteKey || '20082'
    });

    this.addDamageNumber(x, y, `【${chap.bossName} 降临！】`, '#ff3333', true);
  }

  private updateMonsterStatuses(dt: number) {
    this.statusTickTimer += dt;
    if (this.statusTickTimer < 0.5) return;
    const tickSec = this.statusTickTimer;
    this.statusTickTimer = 0;

    for (const m of [...this.monsters]) {
      if (m.hp <= 0) continue;
      let dotDmg = 0;
      let dotColor = '#44ff88';

      if (m.poisonUntil && this.clock < m.poisonUntil && m.poisonDps) {
        dotDmg += Math.round(m.poisonDps * tickSec);
      }
      if (m.burnUntil && this.clock < m.burnUntil && m.burnDps) {
        dotDmg += Math.round(m.burnDps * tickSec);
        dotColor = '#ff7722';
      }

      if (dotDmg > 0) {
        m.hp -= dotDmg;
        this.addDamageNumber(m.x, m.y - 8, `${dotDmg}`, dotColor, false);
        if (m.hp <= 0) {
          this.killEnemy(m);
        }
      }
    }
  }

  private hitPlayer(dmg: number, attacker?: MonsterEntity) {
    if (this.player.invulnerableTime > 0) return;

    let finalDmg = dmg;
    if (this.clock < this.player.shieldUntil) {
      finalDmg *= (1 - this.shieldReduction);
    }

    const rounded = Math.max(1, Math.round(finalDmg));
    this.player.hp -= rounded;
    this.player.invulnerableTime = 0.32;
    sound.play('player_hurt', 0.4);
    this.addDamageNumber(this.player.x, this.player.y - 24, `-${rounded}`, '#ff4d4f', true);

    if (attacker && attacker.hp > 0 && this.clock < this.player.shieldUntil && this.thornRatio > 0) {
      const reflected = Math.max(2, Math.round(rounded * this.thornRatio * 2.2));
      this.damageEnemy(attacker, reflected, false);
    }

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.phase = 'game_over';
      sound.play('player_die');
    }
  }

  damageEnemy(m: MonsterEntity, dmg: number, crit = false) {
    if (m.hp <= 0) return;
    const armorMult = 1 + (m.armorBreak || 0);
    const finalDmg = Math.max(1, Math.round(dmg * armorMult));

    m.hp -= finalDmg;
    this.addDamageNumber(m.x, m.y, `${finalDmg}`, crit ? '#ffdd00' : '#ffffff', crit);
    sound.play('monster_hurt', 0.25);

    if (m.hp <= 0) {
      this.killEnemy(m);
    }
  }

  private killEnemy(m: MonsterEntity) {
    this.monsters = this.monsters.filter(e => e.id !== m.id);
    this.player.kills++;
    sound.play('monster_die', 0.3);

    this.drops.push({
      id: this.nextEntityId++,
      type: 'exp',
      x: m.x,
      y: m.y,
      value: m.exp
    });

    if (m.isElite) {
      this.drops.push({
        id: this.nextEntityId++,
        type: 'potion',
        x: m.x - 16,
        y: m.y + 8,
        value: 40
      });
      this.drops.push({
        id: this.nextEntityId++,
        type: 'gold',
        x: m.x + 16,
        y: m.y + 8,
        value: 25
      });
    } else if (Math.random() < 0.14) {
      const isPotion = Math.random() < 0.35;
      this.drops.push({
        id: this.nextEntityId++,
        type: isPotion ? 'potion' : 'gold',
        x: m.x + (Math.random() - 0.5) * 20,
        y: m.y + (Math.random() - 0.5) * 20,
        value: isPotion ? 28 : 10
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
        const angle = Math.atan2(this.player.y - d.y, this.player.x - d.x);
        const flySpeed = 480;
        d.x += Math.cos(angle) * flySpeed * dt;
        d.y += Math.sin(angle) * flySpeed * dt;

        if (dist <= 32) {
          if (d.type === 'exp') {
            this.gainExp(d.value);
            sound.play('coin', 0.3);
          } else if (d.type === 'gold') {
            this.player.gold += d.value;
            sound.play('coin', 0.4);
          } else if (d.type === 'potion') {
            const healAmt = d.value || 40;
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
            sound.play('potion', 0.5);
            this.addDamageNumber(this.player.x, this.player.y, `+${healAmt} 气血`, '#44ff44');
          }
          this.drops.splice(i, 1);
        }
      }
    }
  }

  gainExp(amount: number) {
    this.player.exp += amount;
    if (this.player.exp >= this.player.maxExp) {
      this.player.exp -= this.player.maxExp;
      this.player.level++;
      this.player.maxExp = Math.round(this.player.maxExp * 1.48 + 5);
      this.player.maxHp += 15;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.round(this.player.maxHp * 0.16));
      this.player.invulnerableTime = Math.max(this.player.invulnerableTime, 0.85);

      // Protective knockback ring on level up
      for (const m of this.monsters) {
        const d = Math.hypot(m.x - this.player.x, m.y - this.player.y);
        if (d < 130 && d > 0) {
          const ang = Math.atan2(m.y - this.player.y, m.x - this.player.x);
          const push = m.isBoss ? 35 : 105;
          m.x = Math.max(80, Math.min(WORLD_WIDTH - 80, m.x + Math.cos(ang) * push));
          m.y = Math.max(80, Math.min(WORLD_HEIGHT - 80, m.y + Math.sin(ang) * push));
        }
      }

      sound.play('skill_holyword');
      this.addDamageNumber(this.player.x, this.player.y, '境界突破!', '#ffe066', true);
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
    const chapDiff = WOOWL_CHAPTERS[this.chapterId]?.chapterDifficulty || 1.0;
    this.player.damageBonus = (chapDiff - 1) * 0.30;
    this.player.speed = this.heroClass === 'warrior' ? 225 : this.heroClass === 'wizard' ? 212 : 218;
    this.player.cooldownBonus = 0;
    this.player.areaBonus = 0;
    this.player.pickupRange = 84;
    this.player.hpRegen = 0.5;

    const baseHp = (this.heroClass === 'warrior' ? 240 : this.heroClass === 'wizard' ? 155 : 190) + Math.round((chapDiff - 1) * 30);
    let hpModTotal = 0;

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
      if (def.effect.hpMod) hpModTotal += def.effect.hpMod * lvl;
    }

    const expectedMaxHp = Math.round((baseHp + (this.player.level - 1) * 15) * (1 + hpModTotal));
    if (expectedMaxHp > this.player.maxHp) {
      const delta = expectedMaxHp - this.player.maxHp;
      this.player.maxHp = expectedMaxHp;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + delta);
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
      life: 0.75
    });
  }

  private updateDamageNumbers(dt: number) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y -= 38 * dt;
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
      if (m.hp <= 0) continue;
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
      .filter(m => m.hp > 0)
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
