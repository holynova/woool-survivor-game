import React, { useState, useSyncExternalStore, useEffect } from 'react';
import { game } from './game';
import { WOOWL_SKILLS, WOOWL_PASSIVES } from './config/skills';
import { WOOWL_CHAPTERS } from './config/chapters';
import type { HeroClass } from './types';
import { sound } from './audio';
import { bootPhaser } from './renderer';
import { assetUrl } from './utils';

function useGameState() {
  return useSyncExternalStore(
    cb => game.subscribe(cb),
    () => ({
      phase: game.phase,
      clock: game.clock,
      player: { ...game.player },
      activeSkills: [...game.activeSkills],
      activePassives: [...game.activePassives],
      upgradeChoices: [...game.upgradeChoices],
      chapterId: game.chapterId,
      heroClass: game.heroClass,
      bossSpawned: game.bossSpawned,
      bossDefeated: game.bossDefeated
    })
  );
}

export function App() {
  const state = useGameState();
  const [selectedClass, setSelectedClass] = useState<HeroClass>('wizard');
  const [selectedChapter, setSelectedChapter] = useState('sunset_island');

  useEffect(() => {
    bootPhaser();
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartGame = () => {
    sound.init();
    sound.play('ui_click');
    game.start(selectedClass, selectedChapter);
  };

  const handleSelectUpgrade = (choice: typeof game.upgradeChoices[0]) => {
    game.selectUpgrade(choice);
  };

  const handleReturnLobby = () => {
    sound.play('ui_click');
    game.resetForLobby();
  };

  return (
    <div className="game-container">
      {/* 1. LOBBY SCREEN */}
      {state.phase === 'lobby' && (
        <div className="lobby-overlay">
          <div className="lobby-panel">
            <div className="lobby-header">
              <img src={assetUrl('assets/woool/logo.png')} alt="传奇世界" className="woool-logo" />
              <div className="game-subtitle">幸存者 · 传世无双</div>
            </div>

            {/* Class Selection */}
            <div className="section-title">选择英雄宗门职业</div>
            <div className="class-cards">
              {/* Warrior */}
              <div
                className={`class-card ${selectedClass === 'warrior' ? 'active' : ''}`}
                onClick={() => {
                  sound.play('ui_click');
                  setSelectedClass('warrior');
                }}
              >
                <div className="class-icon-wrapper">
                  <img src={assetUrl('assets/woool/role/job_1.png')} alt="战士" className="class-emblem" />
                </div>
                <div className="class-name">战 士</div>
                <div className="class-tag">铜皮铁骨 · 贴身近战</div>
                <div className="class-desc">
                  初始气血 160<br />
                  招牌绝技: <strong>抱月刀</strong><br />
                  360度大范围回旋弧月刀气，推开敌群
                </div>
              </div>

              {/* Wizard */}
              <div
                className={`class-card ${selectedClass === 'wizard' ? 'active' : ''}`}
                onClick={() => {
                  sound.play('ui_click');
                  setSelectedClass('wizard');
                }}
              >
                <div className="class-icon-wrapper">
                  <img src={assetUrl('assets/woool/role/job_2.png')} alt="法师" className="class-emblem" />
                </div>
                <div className="class-name">法 师</div>
                <div className="class-tag">紫雷天火 · 极光毁灭</div>
                <div className="class-desc">
                  初始气血 90<br />
                  招牌绝技: <strong>狂龙紫电</strong><br />
                  引九霄神雷连环轰顶，弹跳连锁雷劫
                </div>
              </div>

              {/* Taoist */}
              <div
                className={`class-card ${selectedClass === 'taoist' ? 'active' : ''}`}
                onClick={() => {
                  sound.play('ui_click');
                  setSelectedClass('taoist');
                }}
              >
                <div className="class-icon-wrapper">
                  <img src={assetUrl('assets/woool/role/job_3.png')} alt="道士" className="class-emblem" />
                </div>
                <div className="class-name">道 士</div>
                <div className="class-tag">双斧骷髅 · 幽冥符咒</div>
                <div className="class-desc">
                  初始气血 120<br />
                  招牌绝技: <strong>强化骷髅术</strong><br />
                  召唤手持双大板斧的护法骷髅追砍群魔
                </div>
              </div>
            </div>

            {/* Chapter Selection */}
            <div className="section-title">选择历练试炼地图</div>
            <div className="chapter-cards">
              {Object.values(WOOWL_CHAPTERS).map(chap => (
                <div
                  key={chap.id}
                  className={`chapter-card ${selectedChapter === chap.id ? 'active' : ''}`}
                  onClick={() => {
                    sound.play('ui_click');
                    setSelectedChapter(chap.id);
                  }}
                >
                  <div className="chapter-header">
                    <span className="chapter-name">{chap.name}</span>
                    <span className="chapter-subtitle">{chap.subtitle}</span>
                  </div>
                  <div className="chapter-boss">镇守魔主: 【{chap.bossName}】</div>
                  <div className="chapter-desc">{chap.description}</div>
                </div>
              ))}
            </div>

            {/* Start Button */}
            <div className="lobby-actions">
              <button className="start-btn" onClick={handleStartGame}>
                进入中州 · 开启远征
              </button>
              <div className="controls-hint">
                操作提示: 使用键盘 [W A S D] 或 [方向键] 移动，支持触屏鼠标拖动滑行，技能全部自动释放
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. IN-GAME HUD OVERLAY (battle or level_up) */}
      {(state.phase === 'battle' || state.phase === 'level_up') && (
        <div className="hud-overlay">
          {/* Top Info Bar */}
          <div className="hud-top-bar">
            <div className="top-badge">
              <span className="label">地图</span>
              <span className="val">{WOOWL_CHAPTERS[state.chapterId]?.name || '中州'}</span>
            </div>

            <div className="top-badge">
              <span className="label">时间</span>
              <span className="val">{formatTime(state.clock)}</span>
            </div>

            <div className="top-badge">
              <span className="label">等级</span>
              <span className="val gold">Lv.{state.player.level}</span>
            </div>

            <div className="top-badge">
              <span className="label">斩妖</span>
              <span className="val crimson">{state.player.kills}</span>
            </div>

            <div className="top-badge">
              <span className="label">金币</span>
              <span className="val yellow">{state.player.gold}</span>
            </div>
          </div>

          {/* Exp Bar */}
          <div className="exp-bar-container">
            <div
              className="exp-bar-fill"
              style={{
                width: `${Math.min(100, (state.player.exp / state.player.maxExp) * 100)}%`
              }}
            />
            <div className="exp-bar-text">
              经验: {state.player.exp} / {state.player.maxExp}
            </div>
          </div>

          {/* Bottom HUD Bar */}
          <div className="hud-bottom-bar">
            {/* Health / Mana Orbs */}
            <div className="orbs-container">
              <div className="orb hp-orb">
                <div
                  className="orb-fill hp-fill"
                  style={{
                    height: `${Math.max(0, (state.player.hp / state.player.maxHp) * 100)}%`
                  }}
                />
                <div className="orb-text">
                  气血<br />
                  {Math.ceil(state.player.hp)} / {state.player.maxHp}
                </div>
              </div>

              <div className="orb mp-orb">
                <div
                  className="orb-fill mp-fill"
                  style={{
                    height: `${Math.max(0, (state.player.mp / state.player.maxMp) * 100)}%`
                  }}
                />
                <div className="orb-text">
                  内力<br />
                  {Math.ceil(state.player.mp)} / {state.player.maxMp}
                </div>
              </div>
            </div>

            {/* Active Skills Bar */}
            <div className="slots-panel">
              <div className="slots-header">参悟绝学 ({state.activeSkills.length}/5)</div>
              <div className="slots-list">
                {state.activeSkills.map(s => {
                  const def = WOOWL_SKILLS[s.id];
                  if (!def) return null;
                  return (
                    <div key={s.id} className="skill-slot-item" title={`${def.name} Lv.${s.level}`}>
                      <img
                        src={assetUrl(`assets/woool/skills/${def.iconId}.png`)}
                        alt={def.name}
                        className="skill-slot-icon"
                      />
                      <span className="skill-level-badge">Lv.{s.level}</span>
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, 5 - state.activeSkills.length) }).map((_, i) => (
                  <div key={`empty_s_${i}`} className="skill-slot-item empty">
                    <span className="empty-text">+</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Passives Bar */}
            <div className="slots-panel passives-panel">
              <div className="slots-header">护体宝物 ({state.activePassives.length}/6)</div>
              <div className="slots-list">
                {state.activePassives.map(p => {
                  const def = WOOWL_PASSIVES[p.id];
                  if (!def) return null;
                  return (
                    <div key={p.id} className="skill-slot-item passive" title={`${def.name} Lv.${p.level}`}>
                      <img
                        src={assetUrl(`assets/woool/skills/${def.iconId}.png`)}
                        alt={def.name}
                        className="skill-slot-icon"
                      />
                      <span className="skill-level-badge">Lv.{p.level}</span>
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, 6 - state.activePassives.length) }).map((_, i) => (
                  <div key={`empty_p_${i}`} className="skill-slot-item empty">
                    <span className="empty-text">+</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. LEVEL UP MODAL */}
      {state.phase === 'level_up' && (
        <div className="modal-backdrop">
          <div className="upgrade-dialog">
            <div className="upgrade-header">
              <div className="upgrade-title">传 世 参 悟 · 机 缘 突 破</div>
              <div className="upgrade-desc">
                恭贺宗师升级至 Lv.{state.player.level}，请从以下三种传世秘籍中选择一项领悟
              </div>
            </div>

            <div className="upgrade-cards">
              {state.upgradeChoices.map((choice, idx) => (
                <div
                  key={`${choice.id}_${idx}`}
                  className="upgrade-card"
                  onClick={() => handleSelectUpgrade(choice)}
                >
                  <div className="upgrade-icon-box">
                    <img
                      src={assetUrl(`assets/woool/skills/${choice.iconId}.png`)}
                      alt={choice.title}
                      className="upgrade-icon"
                    />
                    <span className={`upgrade-tag ${choice.isNew ? 'new' : 'up'}`}>
                      {choice.isNew ? '初次习得' : '境界提升'}
                    </span>
                  </div>
                  <div className="upgrade-card-info">
                    <div className="upgrade-card-title">{choice.title}</div>
                    <div className="upgrade-card-text">{choice.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. GAME OVER MODAL */}
      {state.phase === 'game_over' && (
        <div className="modal-backdrop">
          <div className="result-dialog">
            <div className="result-title defeat">胜 败 乃 兵 家 常 事</div>
            <div className="result-stats">
              <div className="result-row">
                <span>历练时间:</span>
                <span className="val">{formatTime(state.clock)}</span>
              </div>
              <div className="result-row">
                <span>斩除魔物:</span>
                <span className="val crimson">{state.player.kills} 尊</span>
              </div>
              <div className="result-row">
                <span>所得金币:</span>
                <span className="val yellow">{state.player.gold} 两</span>
              </div>
              <div className="result-row">
                <span>宗师境界:</span>
                <span className="val gold">Lv.{state.player.level}</span>
              </div>
            </div>
            <button className="confirm-btn" onClick={handleReturnLobby}>
              重整旗鼓 · 重返中州
            </button>
          </div>
        </div>
      )}

      {/* 5. VICTORY MODAL */}
      {state.phase === 'victory' && (
        <div className="modal-backdrop">
          <div className="result-dialog victory">
            <div className="result-title victory">荡 平 妖 邪 · 威 震 传 世</div>
            <div className="result-desc">
              恭贺大侠成功诛灭镇守妖王，名垂落霞中州史册！
            </div>
            <div className="result-stats">
              <div className="result-row">
                <span>通关耗时:</span>
                <span className="val">{formatTime(state.clock)}</span>
              </div>
              <div className="result-row">
                <span>荡平群妖:</span>
                <span className="val crimson">{state.player.kills} 尊</span>
              </div>
              <div className="result-row">
                <span>缴获黄金:</span>
                <span className="val yellow">{state.player.gold} 两</span>
              </div>
              <div className="result-row">
                <span>最终大境:</span>
                <span className="val gold">Lv.{state.player.level}</span>
              </div>
            </div>
            <button className="confirm-btn gold-btn" onClick={handleReturnLobby}>
              凯旋归朝 · 留名青史
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
