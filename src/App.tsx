import React, { useState, useSyncExternalStore, useEffect } from 'react';
import { game } from './game';
import { WOOWL_SKILLS, WOOWL_PASSIVES } from './config/skills';
import { WOOWL_CHAPTERS } from './config/chapters';
import { WOOWL_DIFFICULTY_CURVES } from './config/curves';
import type { HeroClass, DifficultyCurveId } from './types';
import { sound } from './audio';
import { bootPhaser } from './renderer';
import { assetUrl } from './utils';

const APP_VERSION = 'v0.2.0';
const GITHUB_REPO_URL = 'https://github.com/holynova/woool-survivor-game';

function useGameState() {
  useSyncExternalStore(
    cb => game.subscribe(cb),
    () => game.version
  );
  return game;
}

const CLASS_HEAD_MAP: Record<HeroClass, string> = {
  warrior: 'head_1.png',
  wizard: 'head_2.png',
  taoist: 'head_3.png'
};

export function App() {
  const state = useGameState();
  const [selectedClass, setSelectedClass] = useState<HeroClass>('wizard');
  const [selectedChapter, setSelectedChapter] = useState('sunset_island');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyCurveId>('standard');

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
    game.start(selectedClass, selectedChapter, selectedDifficulty);
  };

  const handleSelectUpgrade = (choice: typeof game.upgradeChoices[0]) => {
    sound.play('ui_click');
    game.selectUpgrade(choice);
  };

  const handleReturnLobby = () => {
    sound.play('ui_click');
    game.resetForLobby();
  };

  const activeBoss = state.getActiveBoss();
  const activeCurve = WOOWL_DIFFICULTY_CURVES[state.difficultyId] || WOOWL_DIFFICULTY_CURVES.standard;

  return (
    <div className="game-container">
      {/* 1. LOBBY SCREEN (AUTHENTIC WOOOL STYLE) */}
      {state.phase === 'lobby' && (
        <div className="lobby-overlay" style={{ backgroundImage: `url(${assetUrl('assets/woool/role/bg.jpg')})` }}>
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
                <div className="class-head-box">
                  <img src={assetUrl('assets/woool/ui/role_head_bg.png')} className="head-frame" alt="" />
                  <img src={assetUrl('assets/woool/ui/head_1.png')} className="head-avatar" alt="战士" />
                  <img src={assetUrl('assets/woool/role/job_1.png')} className="class-job-badge" alt="战士" />
                </div>
                <div className="class-name">战 士</div>
                <div className="class-tag">铜皮铁骨 · 贴身近战</div>
                <div className="class-desc">
                  初始气血 240<br />
                  招牌绝技: <strong>抱月刀</strong><br />
                  360度大范围回旋弧月刀气，横扫四面合围敌群
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
                <div className="class-head-box">
                  <img src={assetUrl('assets/woool/ui/role_head_bg.png')} className="head-frame" alt="" />
                  <img src={assetUrl('assets/woool/ui/head_2.png')} className="head-avatar" alt="法师" />
                  <img src={assetUrl('assets/woool/role/job_2.png')} className="class-job-badge" alt="法师" />
                </div>
                <div className="class-name">法 师</div>
                <div className="class-tag">紫雷天火 · 极光毁灭</div>
                <div className="class-desc">
                  初始气血 155<br />
                  招牌绝技: <strong>狂龙紫电</strong><br />
                  引九天紫霄狂雷贯穿苍穹，连锁电弧弹射轰杀
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
                <div className="class-head-box">
                  <img src={assetUrl('assets/woool/ui/role_head_bg.png')} className="head-frame" alt="" />
                  <img src={assetUrl('assets/woool/ui/head_3.png')} className="head-avatar" alt="道士" />
                  <img src={assetUrl('assets/woool/role/job_3.png')} className="class-job-badge" alt="道士" />
                </div>
                <div className="class-name">道 士</div>
                <div className="class-tag">双斧骷髅 · 幽冥符咒</div>
                <div className="class-desc">
                  初始气血 190<br />
                  招牌绝技: <strong>强化骷髅术</strong><br />
                  召唤手持双大板斧的护法骷髅疯狗追杀群妖
                </div>
              </div>
            </div>

            {/* Difficulty Curve Selection */}
            <div className="section-title">选择试炼难度曲线</div>
            <div className="difficulty-cards">
              {Object.values(WOOWL_DIFFICULTY_CURVES).map(curve => (
                <div
                  key={curve.id}
                  className={`difficulty-card curve-${curve.id} ${selectedDifficulty === curve.id ? 'active' : ''}`}
                  onClick={() => {
                    sound.play('ui_click');
                    setSelectedDifficulty(curve.id);
                  }}
                >
                  <div className="difficulty-header">
                    <span className="difficulty-name">{curve.name}</span>
                    <span className="difficulty-badge">{curve.badge}</span>
                  </div>
                  <div className="difficulty-desc">{curve.summary}</div>
                </div>
              ))}
            </div>

            {/* Chapter Selection (6 Maps) */}
            <div className="section-title">选择历练试炼地图 ({Object.keys(WOOWL_CHAPTERS).length}大传世疆域)</div>
            <div className="chapter-cards">
              {Object.values(WOOWL_CHAPTERS).map((chap, idx) => (
                <div
                  key={chap.id}
                  className={`chapter-card ${selectedChapter === chap.id ? 'active' : ''}`}
                  onClick={() => {
                    sound.play('ui_click');
                    setSelectedChapter(chap.id);
                  }}
                >
                  <div className="chapter-thumb-wrapper">
                    <img src={assetUrl(chap.bgImage.replace('./', ''))} className="chapter-thumb-img" alt={chap.name} />
                    <div className="chapter-thumb-overlay" />
                    <span className="chapter-tier-pill">第{idx + 1}幕 · 强度 x{chap.chapterDifficulty.toFixed(1)}</span>
                  </div>
                  <div className="chapter-header">
                    <span className="chapter-name">{chap.name}</span>
                  </div>
                  <div className="chapter-boss">魔主: 【{chap.bossName}】</div>
                  <div className="chapter-desc">{chap.description}</div>
                </div>
              ))}
            </div>

            {/* Start Button & Repo Meta */}
            <div className="lobby-actions">
              <button className="start-btn-woool" onClick={handleStartGame}>
                <span className="btn-text">进入中州 · 开启远征</span>
              </button>
              <div className="controls-hint">
                操作提示: 使用键盘 [W A S D] 或 [方向键] 移动，支持触屏鼠标拖动滑行，技能全部自动释放
              </div>
              <div className="lobby-footer-meta">
                <span>传世幸存者 {APP_VERSION}</span>
                <span className="meta-sep">|</span>
                <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="repo-link">
                  GitHub 源码仓库
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. IN-GAME HUD OVERLAY (AUTHENTIC WOOOL HUD) */}
      {(state.phase === 'battle' || state.phase === 'level_up') && (
        <div className="hud-overlay">
          {/* Top Wrapper */}
          <div className="hud-top-wrapper">
            {/* Top Left Character Status */}
            <div className="hud-player-badge">
              <div className="role-head-container">
                <img src={assetUrl('assets/woool/ui/role_head_bg.png')} className="role-head-frame" alt="" />
                <img src={assetUrl(`assets/woool/ui/${CLASS_HEAD_MAP[state.heroClass] || 'head_2.png'}`)} className="role-avatar" alt="" />
              </div>
              <div className="role-info-container">
                <div className="role-name-row">
                  <span className="role-job-name">{state.heroClass === 'warrior' ? '战士' : state.heroClass === 'wizard' ? '法师' : '道士'}</span>
                  <span className="role-level">Lv.{state.player.level}</span>
                </div>
                <div className="role-hp-row">
                  <div className="role-hp-bar">
                    <div
                      className="role-hp-fill"
                      style={{ width: `${Math.max(0, (state.player.hp / state.player.maxHp) * 100)}%` }}
                    />
                  </div>
                  <span className="role-hp-text">{Math.ceil(state.player.hp)} / {state.player.maxHp}</span>
                </div>
              </div>
            </div>

            {/* Top Stats Bar */}
            <div className="hud-top-bar">
              <div className="top-badge">
                <span className="label">地图</span>
                <span className="val">{WOOWL_CHAPTERS[state.chapterId]?.name || '中州'}</span>
              </div>

              <div className="top-badge">
                <span className="label">{activeCurve.name}</span>
                <span className="val gold">{state.wavePhaseName}</span>
              </div>

              <div className="top-badge">
                <span className="label">时间</span>
                <span className="val">{formatTime(state.clock)} / {formatTime(state.getBossTriggerTime())}</span>
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

            {/* Experience Bar (Top Flush) */}
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

            {/* Active Boss HP Bar */}
            {activeBoss && (
              <div className="hud-boss-bar-wrapper">
                <div className="boss-bar-header">
                  <span className="boss-name-tag">镇守魔尊 · {activeBoss.name}</span>
                  <span className="boss-hp-num">{Math.max(0, Math.ceil(activeBoss.hp))} / {activeBoss.maxHp}</span>
                </div>
                <div className="boss-hp-track">
                  <div
                    className="boss-hp-fill"
                    style={{ width: `${Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Authentic Woool Bottom Bar */}
          <div className="hud-bottom-container">
            <div className="classic-woool-bottom-bar">
              <img src={assetUrl('assets/woool/ui/main_bottom.png')} className="bottom-bar-bg" alt="" />

              {/* Iconic Taiji Dragon Orb (Left Half HP Red, Right Half MP Blue) */}
              <div className="woool-taiji-orb">
                {/* Left HP Crescent */}
                <div className="taiji-crescent crescent-hp" title={`气血: ${Math.ceil(state.player.hp)} / ${state.player.maxHp}`}>
                  <div
                    className="crescent-fill"
                    style={{ height: `${Math.max(0, Math.min(100, (state.player.hp / state.player.maxHp) * 100))}%` }}
                  >
                    <img src={assetUrl('assets/woool/ui/hp_progress.png')} className="crescent-img" alt="HP" />
                  </div>
                </div>

                {/* Right MP Crescent */}
                <div className="taiji-crescent crescent-mp" title={`内力: ${Math.ceil(state.player.mp)} / ${state.player.maxMp}`}>
                  <div
                    className="crescent-fill"
                    style={{ height: `${Math.max(0, Math.min(100, (state.player.mp / state.player.maxMp) * 100))}%` }}
                  >
                    <img src={assetUrl('assets/woool/ui/mp_progress.png')} className="crescent-img" alt="MP" />
                  </div>
                </div>

                {/* Value Text Overlay */}
                <div className="taiji-label-hp">{Math.ceil(state.player.hp)}</div>
                <div className="taiji-label-mp">{Math.ceil(state.player.mp)}</div>
              </div>

              {/* Center Panel: Active Skills (Row 1) & Passives / Equipment (Row 2) */}
              <div className="woool-center-slots-panel">
                {/* Row 1: 5 Skill Slots */}
                <div className="woool-slot-row skills-row">
                  {state.activeSkills.map((s, idx) => {
                    const def = WOOWL_SKILLS[s.id];
                    if (!def) return null;
                    return (
                      <div key={s.id} className="woool-slot-box" title={`${def.name} Lv.${s.level}`}>
                        <img src={assetUrl('assets/woool/ui/item_bg.png')} className="slot-frame" alt="" />
                        <img src={assetUrl(`assets/woool/skills/${def.iconId}.png`)} className="slot-icon" alt={def.name} />
                        <span className="slot-badge">Lv.{s.level}</span>
                        <span className="slot-hotkey">{idx + 1}</span>
                      </div>
                    );
                  })}
                  {Array.from({ length: Math.max(0, 5 - state.activeSkills.length) }).map((_, i) => (
                    <div key={`empty_s_${i}`} className="woool-slot-box empty">
                      <img src={assetUrl('assets/woool/ui/item_bg.png')} className="slot-frame" alt="" />
                      <span className="slot-hotkey">{state.activeSkills.length + i + 1}</span>
                    </div>
                  ))}
                </div>

                {/* Row 2: 6 Passive / Equipment Slots */}
                <div className="woool-slot-row passives-row">
                  {state.activePassives.map(p => {
                    const def = WOOWL_PASSIVES[p.id];
                    if (!def) return null;
                    const iconPath = def.iconType === 'item' || def.iconId > 100000
                      ? `assets/woool/items/${def.iconId}.png`
                      : `assets/woool/skills/${def.iconId}.png`;
                    return (
                      <div key={p.id} className="woool-slot-box passive" title={`${def.name} Lv.${p.level}`}>
                        <img src={assetUrl('assets/woool/ui/equip_bg.png')} className="slot-frame" alt="" />
                        <img src={assetUrl(iconPath)} className="slot-icon item-icon" alt={def.name} />
                        <span className="slot-badge">Lv.{p.level}</span>
                      </div>
                    );
                  })}
                  {Array.from({ length: Math.max(0, 6 - state.activePassives.length) }).map((_, i) => (
                    <div key={`empty_p_${i}`} className="woool-slot-box empty passive">
                      <img src={assetUrl('assets/woool/ui/equip_bg.png')} className="slot-frame" alt="" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. LEVEL UP MODAL (AUTHENTIC WOOOL STYLE) */}
      {state.phase === 'level_up' && (
        <div className="modal-backdrop">
          <div className="upgrade-dialog-woool">
            <div className="dialog-title-banner">
              <div className="title-text">传 世 参 悟 · 境 界 突 破</div>
              <div className="title-sub">
                恭贺宗师升级至 Lv.{state.player.level}，请从以下三种传世机缘中选择一项领悟
              </div>
            </div>

            <div className="upgrade-cards-container">
              {state.upgradeChoices.map((choice, idx) => {
                const choiceIconPath = choice.type === 'passive' || choice.iconId > 100000
                  ? `assets/woool/items/${choice.iconId}.png`
                  : `assets/woool/skills/${choice.iconId}.png`;
                return (
                  <div
                    key={`${choice.id}_${idx}`}
                    className="woool-upgrade-card"
                    onClick={() => handleSelectUpgrade(choice)}
                  >
                    <div className="card-slot-box">
                      <img src={assetUrl('assets/woool/ui/item_bg.png')} className="card-item-bg" alt="" />
                      <img src={assetUrl(choiceIconPath)} className="card-icon" alt={choice.title} />
                      <span className={`card-type-tag ${choice.isNew ? 'tag-new' : 'tag-upgrade'}`}>
                        {choice.isNew ? '初次习得' : '境界突破'}
                      </span>
                    </div>
                    <div className="card-body">
                      <div className="card-heading">{choice.title}</div>
                      <div className="card-detail">{choice.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4 & 5. RESULT MODAL (GAME OVER OR VICTORY) */}
      {(state.phase === 'game_over' || state.phase === 'victory') && (
        <div className="modal-backdrop">
          <div className="result-dialog">
            <div className={`result-title ${state.phase === 'victory' ? 'victory' : 'defeat'}`}>
              {state.phase === 'victory' ? '中 州 凯 旋 · 威 震 天 下' : '胜 败 乃 兵 家 常 事'}
            </div>
            <div className="result-desc">
              {state.phase === 'victory'
                ? `恭喜宗师荡平【${WOOWL_CHAPTERS[state.chapterId]?.name || '秘境'}】，成功通关【${activeCurve.name}】曲线试炼！`
                : `止步于【${WOOWL_CHAPTERS[state.chapterId]?.name || '秘境'} · ${state.wavePhaseName}】（${activeCurve.name}）`}
            </div>
            <div className="result-stats">
              <div className="result-row">
                <span>历练曲线:</span>
                <span className="val gold">{activeCurve.name} ({activeCurve.badge})</span>
              </div>
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

            <div className="result-actions-row">
              <button className="start-btn-woool" onClick={handleStartGame}>
                <span className="btn-text">再 战 一 场</span>
              </button>
              <button className="start-btn-woool secondary-btn" onClick={handleReturnLobby}>
                <span className="btn-text">{state.phase === 'victory' ? '班 师 回 朝' : '重 聚 中 州'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
