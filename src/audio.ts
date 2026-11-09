import { assetUrl } from './utils';

class AudioManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private muted = false;

  constructor() {
    // Lazy AudioContext on user gesture
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  async init(): Promise<void> {
    this.initCtx();
    await this.preloadAll();
  }

  async loadSound(key: string, url: string): Promise<void> {
    this.initCtx();
    if (!this.ctx) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(key, audioBuffer);
    } catch {}
  }

  async preloadAll(): Promise<void> {
    const list = [
      ['ui_click', assetUrl('assets/sound/ui_click.wav')],
      ['coin', assetUrl('assets/sound/coin.wav')],
      ['potion', assetUrl('assets/sound/potion.wav')],
      ['player_hurt', assetUrl('assets/sound/player_hurt.wav')],
      ['player_die', assetUrl('assets/sound/player_die.wav')],
      ['monster_hurt', assetUrl('assets/sound/monster_hurt.wav')],
      ['monster_die', assetUrl('assets/sound/monster_die.wav')],
      ['skill_slash', assetUrl('assets/sound/skill_slash.wav')],
      ['skill_fireball', assetUrl('assets/sound/skill_fireball.wav')],
      ['skill_lightning', assetUrl('assets/sound/skill_lightning.wav')],
      ['skill_hellthunder', assetUrl('assets/sound/skill_hellthunder.wav')],
      ['skill_firewall', assetUrl('assets/sound/skill_firewall.wav')],
      ['skill_shield', assetUrl('assets/sound/skill_shield.wav')],
      ['skill_talisman', assetUrl('assets/sound/skill_talisman.wav')],
      ['skill_poison', assetUrl('assets/sound/skill_poison.wav')],
      ['skill_shinsu', assetUrl('assets/sound/skill_shinsu.wav')],
      ['skill_repel', assetUrl('assets/sound/skill_repel.wav')],
      ['skill_holyword', assetUrl('assets/sound/skill_holyword.wav')]
    ];

    await Promise.all(list.map(([key, url]) => this.loadSound(key, url)));
  }

  play(key: string, volume = 0.5) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const buffer = this.buffers.get(key);
    if (buffer) {
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      source.buffer = buffer;
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);
    } else {
      // Synthesize fallback retro sound
      this.synthesizeRetro(key, volume);
    }
  }

  private synthesizeRetro(key: string, volume: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (key.includes('lightning') || key.includes('thunder')) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
      gain.gain.setValueAtTime(volume * 0.4, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (key.includes('slash')) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
      gain.gain.setValueAtTime(volume * 0.5, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (key.includes('click')) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(volume * 0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
      gain.gain.setValueAtTime(volume * 0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }
}

export const sound = new AudioManager();
