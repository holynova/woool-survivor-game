import type { ChapterDefinition } from '../types';

export const WOOWL_CHAPTERS: Record<string, ChapterDefinition> = {
  sunset_island: {
    id: 'sunset_island',
    name: '落霞岛 · 桃林港镇',
    subtitle: '落霞春晖乘帆渡 · 桃林古镇海潮生',
    bgImage: './assets/woool/maps/map_sunset_town.jpg',
    bossName: '狂暴白骨尸王',
    bossSpriteKey: '20082',
    bossHp: 1450,
    bossDamage: 26,
    chapterDifficulty: 1.0,
    targetKills: 80,
    durationSeconds: 75,
    ambientTheme: 'peach',
    description: '传世勇士启航之海岛古镇，桃花灼灼，飞檐青瓦。深渊魔气侵蚀城镇广场，稻草人、角鹿与毒蟒蜂拥而至！',
    monsterPool: [
      { typeId: 'scarecrow', weight: 35 },
      { typeId: 'deer', weight: 25 },
      { typeId: 'snake', weight: 25 },
      { typeId: 'blade_hound', weight: 10 },
      { typeId: 'skeleton', weight: 5 }
    ]
  },
  central_state: {
    id: 'central_state',
    name: '中州王城 · 城门要塞',
    subtitle: '三圣王远征至此 · 建中州不拔之国',
    bgImage: './assets/woool/maps/map_central_city.jpg',
    bossName: '通天魔将 · 逆魔先锋',
    bossSpriteKey: '20082',
    bossHp: 2100,
    bossDamage: 32,
    chapterDifficulty: 1.22,
    targetKills: 130,
    durationSeconds: 85,
    ambientTheme: 'embers',
    description: '中州王城巍峨城楼与青砖广场，皇城重地防线告急，红野猪、妖化刀犬与骷髅先锋潮水般直扑城门！',
    monsterPool: [
      { typeId: 'wild_boar', weight: 30 },
      { typeId: 'blade_hound', weight: 25 },
      { typeId: 'skeleton', weight: 25 },
      { typeId: 'snake', weight: 10 },
      { typeId: 'enhanced_skeleton', weight: 10 }
    ]
  },
  hot_desert: {
    id: 'hot_desert',
    name: '热砂荒漠 · 土城要塞',
    subtitle: '黄沙漫天遮蔽日 · 土城烽火战妖魔',
    bgImage: './assets/woool/maps/map_desert_city.jpg',
    bossName: '逆魔真身 · 赤炎巨灵',
    bossSpriteKey: '20085',
    bossHp: 2850,
    bossDamage: 38,
    chapterDifficulty: 1.45,
    targetKills: 160,
    durationSeconds: 95,
    ambientTheme: 'sand',
    description: '大漠绝地中的传奇土城要塞，残垣断壁与烽火角楼，狂暴风沙中双斧骷髅将与赤炎兽傀儡全面苏醒！',
    monsterPool: [
      { typeId: 'blade_hound', weight: 25 },
      { typeId: 'skeleton', weight: 25 },
      { typeId: 'wild_boar', weight: 20 },
      { typeId: 'enhanced_skeleton', weight: 20 },
      { typeId: 'shinsu_puppet', weight: 10 }
    ]
  },
  deadwater_marsh: {
    id: 'deadwater_marsh',
    name: '死水沼泽 · 禁地废墟',
    subtitle: '阴风鬼火沉古刹 · 禁地废墟困千军',
    bgImage: './assets/woool/maps/map_forbidden_ruins.jpg',
    bossName: '禁地魔王 · 幽冥魔煞',
    bossSpriteKey: '20082',
    bossHp: 3600,
    bossDamage: 44,
    chapterDifficulty: 1.68,
    targetKills: 190,
    durationSeconds: 105,
    ambientTheme: 'wisp',
    description: '沉没于千年毒瘴沼泽中的古代祭坛废墟，幽蓝鬼火摇曳，毒蛇与亡灵骷髅大军自古桥四面合围！',
    monsterPool: [
      { typeId: 'snake', weight: 35 },
      { typeId: 'blade_hound', weight: 20 },
      { typeId: 'skeleton', weight: 25 },
      { typeId: 'enhanced_skeleton', weight: 15 },
      { typeId: 'shinsu_puppet', weight: 5 }
    ]
  },
  frozen_citadel: {
    id: 'frozen_citadel',
    name: '玄冰古刹 · 苍月雪城',
    subtitle: '千里冰封雪满城 · 苍月烽火战极寒',
    bgImage: './assets/woool/maps/map_frozen_city.jpg',
    bossName: '玄冰圣王 · 寒霜兽皇',
    bossSpriteKey: '20085',
    bossHp: 4500,
    bossDamage: 50,
    chapterDifficulty: 1.92,
    targetKills: 220,
    durationSeconds: 115,
    ambientTheme: 'frost',
    description: '极北冰原的苍月古城要塞，积雪覆檐、玄冰烈焰交织，重甲精锐兽傀儡与妖化兽群疯狂冲击古刹祭坛！',
    monsterPool: [
      { typeId: 'snake', weight: 15 },
      { typeId: 'blade_hound', weight: 25 },
      { typeId: 'wild_boar', weight: 25 },
      { typeId: 'enhanced_skeleton', weight: 25 },
      { typeId: 'shinsu_puppet', weight: 10 }
    ]
  },
  iron_citadel: {
    id: 'iron_citadel',
    name: '铁血魔城 · 魔域王庭',
    subtitle: '黑石熔岩镇八荒 · 铁血魔宫血染衣',
    bgImage: './assets/woool/maps/map_iron_citadel.jpg',
    bossName: '铁血魔王 · 灭世魔君',
    bossSpriteKey: '20085',
    bossHp: 5600,
    bossDamage: 58,
    chapterDifficulty: 2.2,
    targetKills: 260,
    durationSeconds: 125,
    ambientTheme: 'lava',
    description: '终焉魔界深处的黑曜石铁血魔城，岩浆奔涌、铁链锁柱，唯有登峰造极的传世宗师方能在此迎战灭世魔君！',
    monsterPool: [
      { typeId: 'blade_hound', weight: 30 },
      { typeId: 'wild_boar', weight: 25 },
      { typeId: 'skeleton', weight: 25 },
      { typeId: 'enhanced_skeleton', weight: 15 },
      { typeId: 'shinsu_puppet', weight: 5 }
    ]
  }
};
