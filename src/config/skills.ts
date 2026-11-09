import type { SkillDefinition, PassiveDefinition } from '../types';

export const WOOWL_SKILLS: Record<string, SkillDefinition> = {
  // --- 法师招牌技能 ---
  dragon_purple_lightning: {
    id: 'dragon_purple_lightning',
    name: '狂龙紫电',
    classType: 'wizard',
    iconId: 2010,
    desc: '传奇世界法师终极奥义！引九天紫霄狂雷贯穿苍穹，产生剧烈雷暴轰炸与连锁电弧。',
    cooldown: 1.4,
    damage: 48,
    area: 90,
    range: 420,
    soundKey: 'skill_lightning',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '初悟紫电', description: '招引单道狂暴紫雷轰击最近魔物，造成范围雷属性伤害。' },
      { level: 2, title: '雷龙狂舞', description: '伤害提升35%，电弧将向周围额外2个目标跳跃。' },
      { level: 3, title: '紫霄天罚', description: '伤害提升40%，降雷数量增至3道，必定麻痹魔物0.8秒。' },
      { level: 4, title: '【狂龙破天·质变】', description: '天降狂暴紫雷阵！全屏引发持续电磁风暴，消灭敌人时引爆雷环！' }
    ]
  },
  meteor_fire_rain: {
    id: 'meteor_fire_rain',
    name: '流星火雨',
    classType: 'wizard',
    iconId: 2011,
    desc: '从虚空中召唤密集的炽焰流星群轰击地面，产生持续火海灼烧。',
    cooldown: 2.8,
    damage: 32,
    area: 160,
    range: 360,
    soundKey: 'skill_firewall',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '天降炽流', description: '召唤4颗流星轰击随机魔物密集区。' },
      { level: 2, title: '流火连绵', description: '流星数量增至7颗，火海持续时间增加2秒。' },
      { level: 3, title: '焚天烈焰', description: '伤害提升45%，火海附带敌人减速40%效果。' },
      { level: 4, title: '【天外陨灭·质变】', description: '超巨大灭世流星坠地！轰飞全屏怪物并留下持续地心熔浆！' }
    ]
  },
  hell_thunder: {
    id: 'hell_thunder',
    name: '地狱雷光',
    classType: 'wizard',
    iconId: 2003,
    desc: '以施法者自身为核心爆发狂暴环形雷暴，瞬间重创贴身围困的所有魔物。',
    cooldown: 2.2,
    damage: 36,
    area: 180,
    range: 0,
    soundKey: 'skill_hellthunder',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '地煞初雷', description: '爆发一圈雷电冲击波，击退贴身怪物。' },
      { level: 2, title: '九幽雷潮', description: '范围扩大30%，伤害提升30%，冷却缩减0.4秒。' },
      { level: 3, title: '雷殛四方', description: '连续爆发两段环形雷暴，击退幅度加倍。' },
      { level: 4, title: '【万劫雷狱·质变】', description: '雷狱永固！雷暴范围扩大50%，受击魔物防御清零！' }
    ]
  },
  wind_shield: {
    id: 'wind_shield',
    name: '风影盾',
    classType: 'wizard',
    iconId: 2009,
    desc: '唤起呼啸护体风灵力场，大幅提升敏捷闪避与移动速度，受击时气旋推开敌人。',
    cooldown: 6.0,
    damage: 15,
    area: 120,
    range: 0,
    soundKey: 'skill_shield',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '风灵初聚', description: '移动速度提高25%，受击时爆发风浪击退身边魔物。' },
      { level: 2, title: '罡风护体', description: '移动速度提升至35%，获得20%伤害减免。' },
      { level: 3, title: '风暴旋涡', description: '自身周围形成常驻风刃切割力场，每0.5秒刮伤周围敌人。' },
      { level: 4, title: '【极意风影·质变】', description: '踏风无痕！闪避率提升至50%，护盾破碎时全屏狂风刮飞全场魔物！' }
    ]
  },

  // --- 战士招牌技能 ---
  moon_blade: {
    id: 'moon_blade',
    name: '抱月刀',
    classType: 'warrior',
    iconId: 1004,
    desc: '传奇世界战士核心清怪绝学！挥刀狂旋360度释放半月弧光刀气，斩杀四面合围的敌群。',
    cooldown: 1.5,
    damage: 42,
    area: 130,
    range: 0,
    soundKey: 'skill_slash',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '月华初现', description: '挥刀360度环切，横扫身边所有魔物。' },
      { level: 2, title: '圆月狂澜', description: '刀气范围扩大25%，伤害提高35%，击退效果强化。' },
      { level: 3, title: '刀气破空', description: '每次抱月斩额外甩出4道向外扩散的飞刀气。' },
      { level: 4, title: '【满月斩魄·质变】', description: '化身无坚不摧的人肉龙卷！抱月刀气持续常驻高速双旋斩！' }
    ]
  },
  assault_dash: {
    id: 'assault_dash',
    name: '突斩',
    classType: 'warrior',
    iconId: 1010,
    desc: '传世战神霸道绝伦的冲锋位移！向前狂猛冲撞推土机般推挤并碾碎前方所有敌人。',
    cooldown: 3.5,
    damage: 55,
    area: 100,
    range: 220,
    soundKey: 'skill_repel',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '神行突进', description: '朝面朝方向高速突进，撞晕沿途魔物。' },
      { level: 2, title: '势不可挡', description: '冲刺距离增加30%，撞击附带碎石暴击伤害。' },
      { level: 3, title: '破军狂踏', description: '冲刺终点震击地面引发大地撕裂震荡波。' },
      { level: 4, title: '【战神突斩·质变】', description: '连续无缝双重突斩！冲刺期间全程绝对无敌且伤害提升100%！' }
    ]
  },
  diamond_body: {
    id: 'diamond_body',
    name: '金刚护体',
    classType: 'warrior',
    iconId: 1008,
    desc: '运集全身气血凝聚不灭金刚佛光，获得巨额免伤与受击狂暴荆棘反弹。',
    cooldown: 8.0,
    damage: 25,
    area: 140,
    range: 0,
    soundKey: 'skill_holyword',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '金身初铸', description: '开启持续4秒金光护盾，受击伤害减少40%。' },
      { level: 2, title: '不动明王', description: '持续时间延长至6秒，受击时反弹50%伤害给近战攻击者。' },
      { level: 3, title: '金刚怒目', description: '免伤提升至60%，护体期间自身攻击力提高35%。' },
      { level: 4, title: '【罗汉不灭·质变】', description: '常驻金身金光！每消灭10只怪永久增加1点最大生命！' }
    ]
  },
  fire_sword: {
    id: 'fire_sword',
    name: '烈火剑法',
    classType: 'warrior',
    iconId: 1006,
    desc: '引火元素于剑刃之上，挥出毁天灭地的纯阳火剑气，直取妖魔首级。',
    cooldown: 2.6,
    damage: 75,
    area: 90,
    range: 120,
    soundKey: 'skill_fireball',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '真火燃刃', description: '朝前方扇形挥出一道炽烈烈火重击。' },
      { level: 2, title: '双烈火劲', description: '伤害提升40%，附带强力点燃灼烧效果。' },
      { level: 3, title: '烈焰焚八荒', description: '烈火剑气延伸为巨大十字火焰斩。' },
      { level: 4, title: '【火神破天·质变】', description: '烈火暴击率达到100%！被击败的目标产生大爆炸连环引燃！' }
    ]
  },

  // --- 道士招牌技能 ---
  enhanced_skeleton: {
    id: 'enhanced_skeleton',
    name: '强化骷髅术',
    classType: 'taoist',
    iconId: 3012,
    desc: '传世道士最帅绝技！召唤2具手持双柄巨板斧的狂暴强化骷髅，自动全图疯狗般追斩魔物！',
    cooldown: 5.0,
    damage: 38,
    area: 70,
    range: 500,
    soundKey: 'skill_shinsu',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '通灵白骨', description: '召唤1具强化白骨侍卫，手握双斧自主索敌砍杀。' },
      { level: 2, title: '双骨成阵', description: '同时召唤2具强化骷髅！侍卫移动速度提高30%。' },
      { level: 3, title: '狂暴斧风', description: '强化骷髅攻击附带范围回旋斧风，攻速提升50%。' },
      { level: 4, title: '【修罗双煞·质变】', description: '骷髅体型暴增为修罗巨灵！攻击附带吸血并为道士主人分担50%伤害！' }
    ]
  },
  ghost_fire_curse: {
    id: 'ghost_fire_curse',
    name: '幽冥火咒',
    classType: 'taoist',
    iconId: 3011,
    desc: '道家天机秘术，唤出幽蓝摄魄的冥火神符，回旋飞舞后锁敌轰杀。',
    cooldown: 1.6,
    damage: 44,
    area: 85,
    range: 380,
    soundKey: 'skill_talisman',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '幽火化符', description: '投掷2道旋转幽冥火符，自动追踪最近敌人爆炸。' },
      { level: 2, title: '冥符追魂', description: '火符数量增至4道，爆炸范围扩大25%。' },
      { level: 3, title: '九幽摄魄', description: '伤害提升40%，受击魔物被幽冥寒气冻结1秒。' },
      { level: 4, title: '【太极道煞·质变】', description: '8符连环齐发！幽火命中魔物后分裂为无数幽冥火苗二次爆裂！' }
    ]
  },
  poison_cloud: {
    id: 'poison_cloud',
    name: '施毒术',
    classType: 'taoist',
    iconId: 3004,
    desc: '提炼红绿双色秘制奇毒，绿毒噬肉腐血，红毒蚀骨破防。',
    cooldown: 3.2,
    damage: 18,
    area: 150,
    range: 300,
    soundKey: 'skill_poison',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '阴阳双毒', description: '向怪群泼洒毒雾，附带持续扣血与防御降低20%。' },
      { level: 2, title: '漫天毒瘴', description: '毒雾范围扩大35%，持续时间延长至6秒。' },
      { level: 3, title: '蛊毒钻心', description: '中毒敌人死亡时爆出剧毒尸爆，传染周围敌群。' },
      { level: 4, title: '【万劫蛊王·质变】', description: '毒云全图扩散！中毒魔物移速降低50%，受到所有伤害翻倍！' }
    ]
  },
  shinsu_summon: {
    id: 'shinsu_summon',
    name: '召唤神兽',
    classType: 'taoist',
    iconId: 3007,
    desc: '沟通上古神境召唤赤焰麒麟圣兽，吐出炽烈龙炎喷射扇形敌群。',
    cooldown: 7.0,
    damage: 60,
    area: 120,
    range: 450,
    soundKey: 'skill_shinsu',
    maxLevel: 4,
    upgrades: [
      { level: 1, title: '神兽降世', description: '召唤1只喷火神兽护体，神兽吐出烈火横扫前方。' },
      { level: 2, title: '神兽狂怒', description: '神兽血量增加100%，龙炎喷射射程延长40%。' },
      { level: 3, title: '圣兽烈阳', description: '神兽普通攻击附带击退，吐息造成持续地面火线。' },
      { level: 4, title: '【天尊金乌神兽·质变】', description: '晋升为金色麒麟巨神兽！周期性召唤天火流星辅助主人！' }
    ]
  }
};

export const WOOWL_PASSIVES: Record<string, PassiveDefinition> = {
  sacred_stone: {
    id: 'sacred_stone',
    name: '传世神兵玄晶',
    iconId: 1001,
    desc: '淬炼上古玄铁精魄，提升所有招式技能威力与破坏力。',
    maxLevel: 4,
    effect: { damageMod: 0.15 }
  },
  wind_boots: {
    id: 'wind_boots',
    name: '风雷神行步',
    iconId: 1005,
    desc: '身若游龙，穿梭于千军万马，大幅提升移动速度。',
    maxLevel: 4,
    effect: { speedMod: 0.15 }
  },
  snow_lotus: {
    id: 'snow_lotus',
    name: '天山雪莲玉髓',
    iconId: 3003,
    desc: '西域雪山万年奇珍，大幅增加生命上限，并赋予源源不断的自然回血能力。',
    maxLevel: 4,
    effect: { hpMod: 0.2, hpRegen: 2 }
  },
  abyss_orb: {
    id: 'abyss_orb',
    name: '深渊魔晶珠',
    iconId: 2008,
    desc: '引聚天地灵气波纹，扩大所有技能的打击范围与影响范围。',
    maxLevel: 4,
    effect: { areaMod: 0.2 }
  },
  taichi_pill: {
    id: 'taichi_pill',
    name: '太极洗髓金丹',
    iconId: 3010,
    desc: '打通奇经八脉，气血流转神速，缩短所有技能招式冷却间隔。',
    maxLevel: 4,
    effect: { cooldownMod: -0.12 }
  },
  gravity_magnet: {
    id: 'gravity_magnet',
    name: '玛法乾坤引力石',
    iconId: 1009,
    desc: '内蕴乾坤磁场，大幅扩大战利品、金币与灵力结晶的磁吸摄取距离。',
    maxLevel: 4,
    effect: { pickupRangeMod: 0.4 }
  }
};
