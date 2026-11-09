# 传奇世界幸存者 (World of Legend Survivor)

基于盛大《传奇世界》经典官方美术资产开发的轻度肉鸽生存闯关游戏（Survivor / Bullet Heaven）。
采用 Phaser 3 + React 19 + TypeScript + Vite 构建。

---

## 游戏核心特色与美术资源

### 1. 纯正《传奇世界》官方美术资产
- **职业与角色**:
  - 战士 (战圣): 专属重甲模型、双持刀光、金刚不坏之体
  - 法师 (法神): 紫霄法袍、雷电缠绕、天雷紫电招牌
  - 道士 (道尊): 飘逸道袍、手持拂尘、符咒环绕
- **招牌绝技 (110x110 高清图标与真实动效)**:
  - 法师: **狂龙紫电** (从天而降连环轰顶紫霄神雷)、流星火雨、地狱雷光、风影盾
  - 战士: **抱月刀** (360度弧月刀气扫荡击退)、突斩 (推土机猛冲撞飞)、金刚护体、烈火剑法
  - 道士: **强化骷髅术** (手持双大板斧狂暴疾走追砍群妖)、幽冥火咒 (幽蓝冥符飞袭爆裂)、施毒术、召唤神兽
- **原版怪物群**:
  - 稻草人 (20112)、剧毒蟒蛇 (20038)、刀犬 (20111)、鹿 (20072)
  - 白骨骷髅 (20081)、双斧强化骷髅 (20082)、赤焰神兽 (20085)
- **三大历练试炼地图**:
  - 落霞岛: 新手宗门试炼，迎战稻草人与林莽凶兽
  - 中州王城: 邪皇军团入侵，斩杀白骨骷髅潮
  - 热砂荒漠: 漫天黄沙，决战强化骷髅魔尊
- **经典特效与UI**:
  - 升级金光: 原版 `level_up` 23帧金光柱沐浴全身
  - 经典主界面红蓝气血内力双球与技能快捷栏

---

## 目录结构

- [public/assets/woool/](file:///Users/sym/code/woool-survivor-game/public/assets/woool): 传世素材库 (英雄图集、怪物图集、技能图标、地图底图、UI组件)
- [src/types.ts](file:///Users/sym/code/woool-survivor-game/src/types.ts): 核心类型定义 (英雄职业、技能配置、实体状态、伤害事件)
- [src/config/skills.ts](file:///Users/sym/code/woool-survivor-game/src/config/skills.ts): 传世技能与护体秘宝详细数值与进阶描述
- [src/config/chapters.ts](file:///Users/sym/code/woool-survivor-game/src/config/chapters.ts): 关卡与刷怪波次配置
- [src/game.ts](file:///Users/sym/code/woool-survivor-game/src/game.ts): 游戏主引擎 (移动、索敌、自动施法、召唤物AI、经验掉落、三选一生成)
- [src/renderer.ts](file:///Users/sym/code/woool-survivor-game/src/renderer.ts): Phaser 3 渲染引擎 (动态图集动画管理、多方向翻转、特效粒子绘制)
- [src/App.tsx](file:///Users/sym/code/woool-survivor-game/src/App.tsx): React 游戏大厅与HUD界面 (职业选择、关卡选择、技能面板、升级弹窗)
- [src/style.css](file:///Users/sym/code/woool-survivor-game/src/style.css): 传世暗黑金属青铜风格样式

---

## 本地启动与构建

1. 安装依赖:
```bash
npm install
```

2. 启动本地开发服务:
```bash
npm run dev
```

3. 打包生产静态资源:
```bash
npm run build
```
输出目录位于 `dist/`，可直接部署至任意静态服务器、GitHub Pages 或 Cloudflare Workers。
