// src/utils/soundEffects.ts

export interface AlarmRingtone {
  id: string;
  name: string;
  url: string;
}

export const ALARM_RINGTONES: AlarmRingtone[] = [
  {
    id: "toque-01",
    name: "Toque 01",
    url: "/assets/toques/Toque-01.mp3",
  },
  {
    id: "toque-02",
    name: "Toque 02",
    url: "/assets/toques/Toque-02.mp3",
  },
  {
    id: "toque-03",
    name: "Toque 03",
    url: "/assets/toques/Toque-03.mp3",
  },
  {
    id: "toque-04",
    name: "Toque 04",
    url: "/assets/toques/Toque-04.mp3",
  },
  {
    id: "toque-05",
    name: "Toque 05",
    url: "/assets/toques/Toque-05.mp3",
  },
  {
    id: "toque-06",
    name: "Toque 06",
    url: "/assets/toques/Toque-06.mp3",
  },
  {
    id: "toque-07",
    name: "Toque 07",
    url: "/assets/toques/Toque-07.mp3",
  },
  {
    id: "toque-08",
    name: "Toque 08",
    url: "/assets/toques/Toque-08.mp3",
  },
  {
    id: "toque-09",
    name: "Toque 09",
    url: "/assets/toques/Toque-09.mp3",
  },
  {
    id: "toque-10",
    name: "Toque 10",
    url: "/assets/toques/Toque-10.mp3",
  },
  {
    id: "toque-11",
    name: "Toque 11",
    url: "/assets/toques/Toque-11.mp3",
  },
];

export const DEFAULT_RINGTONE_ID = "toque-01";

class SoundManager {
  private readonly STORAGE_KEY_ENABLED = 'gabarita_sound_enabled';
  private readonly STORAGE_KEY_MUTED = 'cronometro_muted';
  private readonly STORAGE_KEY_VOLUME = 'cronometro_volume';
  private readonly STORAGE_KEY_RINGTONE = 'cronometro_toque_selecionado';

  private alarmAudio: HTMLAudioElement | null = null;
  private previewAudio: HTMLAudioElement | null = null;
  private previewingId: string | null = null;
  private alarmOwner: symbol | null = null;

  private get alarmRinging(): boolean {
    return this.alarmOwner !== null;
  }

  public isMuted(): boolean {
    if (typeof window === 'undefined') return false;
    const savedMuted = localStorage.getItem(this.STORAGE_KEY_MUTED);
    if (savedMuted !== null) {
      return savedMuted === 'true';
    }
    const savedEnabled = localStorage.getItem(this.STORAGE_KEY_ENABLED);
    if (savedEnabled !== null) {
      return savedEnabled !== 'true';
    }
    return false;
  }

  public setMuted(muted: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY_MUTED, String(muted));
    localStorage.setItem(this.STORAGE_KEY_ENABLED, String(!muted));

    const effectiveVol = this.getEffectiveVolume();
    if (this.previewAudio) {
      this.previewAudio.volume = effectiveVol;
    }

    if (muted && this.alarmAudio) {
      this.alarmAudio.volume = 0;
      this.alarmAudio.pause();
    } else if (!muted && this.alarmRinging) {
      this.playLoopingAudio();
    }

    window.dispatchEvent(new CustomEvent('gabarita_muted_changed', { detail: muted }));
    window.dispatchEvent(new CustomEvent('gabarita_sound_toggled', { detail: !muted }));
  }

  public getVolume(): number {
    if (typeof window === 'undefined') return 80;
    const saved = localStorage.getItem(this.STORAGE_KEY_VOLUME);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) {
        return Math.max(0, Math.min(100, parsed));
      }
    }
    localStorage.setItem(this.STORAGE_KEY_VOLUME, '80');
    return 80;
  }

  public setVolume(volume: number): void {
    if (typeof window === 'undefined') return;
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    localStorage.setItem(this.STORAGE_KEY_VOLUME, String(clamped));

    if (clamped === 0 && !this.isMuted()) {
      localStorage.setItem(this.STORAGE_KEY_MUTED, 'true');
      localStorage.setItem(this.STORAGE_KEY_ENABLED, 'false');
      window.dispatchEvent(new CustomEvent('gabarita_muted_changed', { detail: true }));
      window.dispatchEvent(new CustomEvent('gabarita_sound_toggled', { detail: false }));
    } else if (clamped > 0 && this.isMuted()) {
      localStorage.setItem(this.STORAGE_KEY_MUTED, 'false');
      localStorage.setItem(this.STORAGE_KEY_ENABLED, 'true');
      window.dispatchEvent(new CustomEvent('gabarita_muted_changed', { detail: false }));
      window.dispatchEvent(new CustomEvent('gabarita_sound_toggled', { detail: true }));
    }

    const effectiveVol = this.getEffectiveVolume();
    if (this.previewAudio) {
      this.previewAudio.volume = effectiveVol;
    }
    if (this.alarmAudio) {
      this.alarmAudio.volume = effectiveVol;
      if (effectiveVol > 0 && this.alarmRinging && this.alarmAudio.paused) {
        this.playLoopingAudio();
      } else if (effectiveVol === 0 && !this.alarmAudio.paused) {
        this.alarmAudio.pause();
      }
    }

    window.dispatchEvent(new CustomEvent('gabarita_volume_changed', { detail: clamped }));
  }

  public getEffectiveVolume(): number {
    const isMuted = this.isMuted();
    const volume = this.getVolume();
    return isMuted ? 0 : Math.max(0, Math.min(1, volume / 100));
  }

  public isEnabled(): boolean {
    return !this.isMuted() && this.getVolume() > 0;
  }

  public setSoundEnabled(enabled: boolean): void {
    if (enabled && this.getVolume() === 0) {
      this.setVolume(80);
    }
    this.setMuted(!enabled);
  }

  public toggleSound(): boolean {
    const currentlyMuted = this.isMuted() || this.getVolume() === 0;
    if (currentlyMuted) {
      if (this.getVolume() === 0) {
        this.setVolume(80);
      }
      this.setMuted(false);
      return true;
    } else {
      this.setMuted(true);
      return false;
    }
  }

  public getSelectedRingtoneId(): string {
    if (typeof window === 'undefined') return DEFAULT_RINGTONE_ID;
    const saved = localStorage.getItem(this.STORAGE_KEY_RINGTONE);
    if (saved && ALARM_RINGTONES.some(r => r.id === saved)) {
      return saved;
    }
    localStorage.setItem(this.STORAGE_KEY_RINGTONE, DEFAULT_RINGTONE_ID);
    return DEFAULT_RINGTONE_ID;
  }

  public getSelectedRingtone(): AlarmRingtone {
    const id = this.getSelectedRingtoneId();
    return ALARM_RINGTONES.find(r => r.id === id) || ALARM_RINGTONES[0];
  }

  public setSelectedRingtoneId(id: string): void {
    if (typeof window === 'undefined') return;
    const found = ALARM_RINGTONES.find(r => r.id === id) || ALARM_RINGTONES[0];
    localStorage.setItem(this.STORAGE_KEY_RINGTONE, found.id);

    // Atualiza o src pré-aquecido se o alarme não estiver tocando no momento
    if (this.alarmAudio && !this.alarmRinging) {
      this.alarmAudio.src = found.url;
      this.alarmAudio.load();
    }

    window.dispatchEvent(new CustomEvent('gabarita_ringtone_changed', { detail: found.id }));
  }

  public getPreviewingId(): string | null {
    return this.previewingId;
  }

  public togglePreview(id: string): void {
    if (this.previewingId === id) {
      this.stopPreview();
      return;
    }
    this.playPreview(id);
  }

  public playPreview(id: string): void {
    if (typeof window === 'undefined') return;
    this.stopPreview();

    const ringtone = ALARM_RINGTONES.find(r => r.id === id);
    if (!ringtone) return;

    try {
      const isMuted = this.isMuted();
      const volume = this.getVolume();
      const audio = new Audio(ringtone.url);
      audio.loop = false;
      audio.volume = isMuted ? 0 : volume / 100;
      this.previewAudio = audio;
      this.previewingId = id;
      window.dispatchEvent(new CustomEvent('gabarita_preview_changed', { detail: id }));

      audio.onended = () => {
        if (this.previewingId === id) {
          this.previewingId = null;
          this.previewAudio = null;
          window.dispatchEvent(new CustomEvent('gabarita_preview_changed', { detail: null }));
        }
      };

      audio.onerror = () => {
        if (this.previewingId === id) {
          this.previewingId = null;
          this.previewAudio = null;
          window.dispatchEvent(new CustomEvent('gabarita_preview_changed', { detail: null }));
        }
      };

      audio.play().catch(() => {
        this.previewingId = null;
        this.previewAudio = null;
        window.dispatchEvent(new CustomEvent('gabarita_preview_changed', { detail: null }));
      });
    } catch {
      this.previewingId = null;
      window.dispatchEvent(new CustomEvent('gabarita_preview_changed', { detail: null }));
    }
  }

  public stopPreview(): void {
    if (this.previewAudio) {
      try {
        this.previewAudio.pause();
        this.previewAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.previewAudio = null;
    }
    if (this.previewingId !== null) {
      this.previewingId = null;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gabarita_preview_changed', { detail: null }));
      }
    }
  }

  /**
   * Desbloqueio preventivo de áudio (Autoplay Unlock)
   * Deve ser chamado ao clicar em "Iniciar" ou "Retomar" o cronômetro
   */
  public unlockAudio(): void {
    if (typeof window === 'undefined' || this.alarmRinging) return;

    try {
      const ringtone = this.getSelectedRingtone();
      if (!this.alarmAudio) {
        this.alarmAudio = new Audio(ringtone.url);
      } else if (this.alarmAudio.src !== ringtone.url) {
        this.alarmAudio.src = ringtone.url;
      }
      this.alarmAudio.loop = true;
      this.alarmAudio.preload = 'auto';

      // Warm-up silencioso rápido para desbloquear reprodução em background
      this.alarmAudio.muted = true;
      const playPromise = this.alarmAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (this.alarmAudio && !this.alarmRinging) {
              this.alarmAudio.pause();
              this.alarmAudio.currentTime = 0;
              this.alarmAudio.muted = false;
            }
          })
          .catch(() => {
            if (this.alarmAudio) {
              this.alarmAudio.muted = false;
            }
          });
      } else {
        this.alarmAudio.muted = false;
      }
    } catch {
      // ignore
    }
  }

  public isAlarmRinging(owner: symbol): boolean {
    return this.alarmOwner === owner;
  }

  private playLoopingAudio(): void {
    const isMuted = this.isMuted();
    const volume = this.getVolume();
    const effectiveVol = isMuted ? 0 : volume / 100;
    if (effectiveVol <= 0) return;

    try {
      const ringtone = this.getSelectedRingtone();
      if (!this.alarmAudio) {
        this.alarmAudio = new Audio(ringtone.url);
      } else if (this.alarmAudio.src !== ringtone.url) {
        this.alarmAudio.src = ringtone.url;
      }
      this.alarmAudio.muted = false;
      this.alarmAudio.volume = effectiveVol;
      this.alarmAudio.loop = true;
      this.alarmAudio.currentTime = 0;
      this.alarmAudio.play().catch((err) => {
        console.warn('Não foi possível iniciar o toque em loop:', err);
      });
    } catch (err) {
      console.warn('Erro ao reproduzir toque de alarme:', err);
    }
  }

  public startContinuousAlarm(owner: symbol): void {
    if (typeof window === 'undefined' || this.isAlarmRinging(owner)) return;

    this.stopPreview();
    this.alarmOwner = owner;
    window.dispatchEvent(new CustomEvent('gabarita_alarm_state_changed'));
    this.playLoopingAudio();
  }

  public stopAlarm(owner: symbol): void {
    if (!this.isAlarmRinging(owner)) return;

    if (this.alarmAudio) {
      try {
        this.alarmAudio.pause();
        this.alarmAudio.currentTime = 0;
      } catch {
        // O áudio pode já ter sido descartado pelo navegador.
      }
    }

    this.alarmOwner = null;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gabarita_alarm_state_changed'));
    }
  }
}

export const soundManager = new SoundManager();
