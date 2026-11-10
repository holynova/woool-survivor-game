import type { ChapterDefinition } from '../types';

export const WOOWL_CHAPTERS: Record<string, ChapterDefinition> = {
  sunset_island: {
    id: 'sunset_island',
    name: '落霞岛 · 桃林港镇',
    subtitle: '落霞春晖乘帆渡 · 桃林古镇海潮生',
    bgImage: './assets/woool/maps/map_sunset_town.jpg',
    bossName: '狂暴白骨尸王',
    targetKills: 80,
    durationSeconds: 150,
    description: '传世勇士梦想启航之海岛古镇，桃花灼灼，飞檐青瓦，石板广场宽阔。然而深渊魔气正在侵蚀城镇，稻草人与凶猛毒蛇自海滩破门而入！',
    monsterPool: [
      { typeId: 'scarecrow', weight: 40 },
      { typeId: 'snake', weight: 30 },
      { typeId: 'blade_hound', weight: 20 },
      { typeId: 'skeleton', weight: 10 }
    ]
  },
  central_state: {
    id: 'central_state',
    name: '中州王城 · 城门要塞',
    subtitle: '三圣王远征至此 · 建中州不拔之国',
    bgImage: './assets/woool/maps/map_central_city.jpg',
    bossName: '通天魔将 · 逆魔先锋',
    targetKills: 150,
    durationSeconds: 180,
    description: '中州王城巍峨城楼与青砖广场，皇城重地防线告急，金顶飞檐、旌旗烈烈、战鼓震天，妖魔狂潮直扑城门！',
    monsterPool: [
      { typeId: 'wild_boar', weight: 35 },
      { typeId: 'blade_hound', weight: 25 },
      { typeId: 'skeleton', weight: 20 },
      { typeId: 'enhanced_skeleton', weight: 20 }
    ]
  },
  hot_desert: {
    id: 'hot_desert',
    name: '热砂荒漠 · 土城要塞',
    subtitle: '黄沙漫天遮蔽日 · 土城烽火战妖魔',
    bgImage: './assets/woool/maps/map_desert_city.jpg',
    bossName: '逆魔真身 · 赤炎巨灵',
    targetKills: 200,
    durationSeconds: 210,
    description: '大漠绝地中的传奇土城要塞，残垣断壁与烽火角楼，狂暴风沙呼啸，沉睡千年的古代妖兽破土苏醒！',
    monsterPool: [
      { typeId: 'blade_hound', weight: 20 },
      { typeId: 'enhanced_skeleton', weight: 30 },
      { typeId: 'shinsu_puppet', weight: 30 },
      { typeId: 'skeleton', weight: 20 }
    ]
  }
};
