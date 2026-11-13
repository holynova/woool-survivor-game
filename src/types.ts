export type HeroClass = 'warrior' | 'wizard' | 'taoist';

export type GamePhase = 'lobby' | 'battle' | 'level_up' | 'game_over' | 'victory';

export type DifficultyCurveId = 'casual' | 'standard' | 'surge' | 'hell';

export interface SkillDefinition {
  id: string;
  name: string;
  classType: HeroClass | 'all';
  iconId: number; // e.g. 2010 for 狂龙紫电
  desc: string;
  cooldown: number; // in seconds
  damage: number;
  area: number;
  range: number;
  duration?: number;
  soundKey: string;
  maxLevel: number;
  upgrades: {
    level: number;
    title: string;
    description: string;
  }[];
}

export interface PassiveDefinition {
  id: string;
  name: string;
  iconId: number;
  iconType?: 'skill' | 'item';
  desc: string;
  maxLevel: number;
  effect: {
    damageMod?: number;
    speedMod?: number;
    hpMod?: number;
    cooldownMod?: number;
    areaMod?: number;
    pickupRangeMod?: number;
    hpRegen?: number;
  };
}

export interface PlayerState {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  exp: number;
  maxExp: number;
  speed: number;
  gold: number;
  kills: number;
  dir: number; // 0-7
  moving: boolean;
  damageBonus: number;
  cooldownBonus: number;
  areaBonus: number;
  pickupRange: number;
  hpRegen: number;
  invulnerableTime: number;
  shieldUntil: number;
}

export interface ActiveSkillState {
  id: string;
  level: number;
  cdTimer: number;
  maxCd?: number;
}

export interface ActivePassiveState {
  id: string;
  level: number;
}

export interface MonsterEntity {
  id: number;
  typeId: string;
  name: string;
  x: number;
  y: number;
  dir?: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  exp: number;
  radius: number;
  isBoss?: boolean;
  isElite?: boolean;
  color?: number;
  animKey?: string;
  spriteKey?: string;
  slowUntil?: number;
  stunUntil?: number;
  poisonUntil?: number;
  poisonDps?: number;
  burnUntil?: number;
  burnDps?: number;
  armorBreak?: number;
  dashCd?: number;
}

export interface MinionEntity {
  id: number;
  type: 'skeleton' | 'shinsu';
  name: string;
  x: number;
  y: number;
  dir?: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  targetEnemyId: number | null;
  attackCd: number;
}

export interface DropEntity {
  id: number;
  type: 'exp' | 'gold' | 'potion' | 'chest';
  x: number;
  y: number;
  value: number;
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  crit?: boolean;
  life: number;
}

export interface EffectEvent {
  id: number;
  type:
    | 'lightning'
    | 'blade_arc'
    | 'talisman'
    | 'meteor'
    | 'hell_thunder'
    | 'poison'
    | 'fire_slash'
    | 'level_up'
    | 'shield'
    | 'dash'
    | 'diamond_body'
    | 'wind_shield'
    | 'shinsu'
    | 'shinsu_hit'
    | 'skeleton'
    | 'skeleton_hit';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  dir?: number;
  radius?: number;
  color?: number;
}

export interface MonsterArchetype {
  id: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  exp: number;
  radius: number;
  spriteKey: string;
}

export interface DifficultyCurveDefinition {
  id: DifficultyCurveId;
  name: string;
  badge: string;
  summary: string;
  hpMult: number;
  dmgMult: number;
  speedMult: number;
  densityMult: number;
  expMult: number;
  cdMult: number;
  eliteInterval: number;
  bossTimeScale: number;
  bossHpMult: number;
  bossDmgMult: number;
}

export interface ChapterDefinition {
  id: string;
  name: string;
  subtitle: string;
  bgImage: string;
  bossName: string;
  bossSpriteKey: string;
  bossHp: number;
  bossDamage: number;
  chapterDifficulty: number;
  targetKills: number;
  durationSeconds: number;
  description: string;
  ambientTheme: 'peach' | 'embers' | 'sand' | 'wisp' | 'frost' | 'lava';
  monsterPool: {
    typeId: string;
    weight: number;
  }[];
}
