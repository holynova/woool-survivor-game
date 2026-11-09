import type { ChapterDefinition } from '../types';

export const WOOWL_CHAPTERS: Record<string, ChapterDefinition> = {
  sunset_island: {
    id: 'sunset_island',
    name: '落霞岛 · 桃林浅滩',
    subtitle: '落霞春晖乘帆渡 · 人比桃花江映红',
    bgImage: './assets/woool/maps/1.jpg',
    bossName: '狂暴白骨尸王',
    targetKills: 80,
    durationSeconds: 150,
    description: '传世勇士梦想开始之岛，海风吹拂桃花纷飞，然而深渊魔气正在浸染沙滩，稻草人与凶猛蟒蛇破土而出！',
    monsterPool: [
      { typeId: 'scarecrow', weight: 40 },
      { typeId: 'snake', weight: 30 },
      { typeId: 'blade_hound', weight: 20 },
      { typeId: 'skeleton', weight: 10 }
    ]
  },
  central_state: {
    id: 'central_state',
    name: '中州王城 · 城郊旷野',
    subtitle: '三圣王远征至此 · 建中州不拔之国',
    bgImage: './assets/woool/maps/2100.jpg',
    bossName: '通天魔将 · 逆魔先锋',
    targetKills: 150,
    durationSeconds: 180,
    description: '中州王城外围旷野，强大的军团防线被妖魔潮水撕裂，凶暴野猪与双斧强化骷髅疯狂袭击防守据点！',
    monsterPool: [
      { typeId: 'wild_boar', weight: 35 },
      { typeId: 'blade_hound', weight: 25 },
      { typeId: 'skeleton', weight: 20 },
      { typeId: 'enhanced_skeleton', weight: 20 }
    ]
  },
  hot_desert: {
    id: 'hot_desert',
    name: '热砂荒漠 · 绝望沙暴',
    subtitle: '黄沙漫天遮蔽日 · 逆魔古刹现凶光',
    bgImage: './assets/woool/maps/3100.jpg',
    bossName: '逆魔真身 · 赤炎巨灵',
    targetKills: 200,
    durationSeconds: 210,
    description: '狂暴风沙肆虐的远古荒原，地火喷涌，无数沉睡千年的古代妖兽与神兽傀儡全面苏醒！',
    monsterPool: [
      { typeId: 'blade_hound', weight: 20 },
      { typeId: 'enhanced_skeleton', weight: 30 },
      { typeId: 'shinsu_puppet', weight: 30 },
      { typeId: 'skeleton', weight: 20 }
    ]
  }
};
