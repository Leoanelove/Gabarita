// src/hooks/useTimerAlarm.ts
import { useState, useEffect, useCallback } from 'react';
import {
  soundManager,
  ALARM_RINGTONES,
  AlarmRingtone,
  TriggerAlarmOptions,
} from '../utils/soundEffects';

export function useTimerAlarm() {
  const [isSoundOn, setIsSoundOn] = useState<boolean>(() => soundManager.isEnabled());
  const [isMuted, setIsMutedState] = useState<boolean>(() => soundManager.isMuted());
  const [volume, setVolumeState] = useState<number>(() => soundManager.getVolume());
  const [selectedRingtoneId, setSelectedRingtoneId] = useState<string>(() =>
    soundManager.getSelectedRingtoneId()
  );
  const [previewingId, setPreviewingId] = useState<string | null>(() =>
    soundManager.getPreviewingId()
  );
  const [isAlarmRinging, setIsAlarmRinging] = useState<boolean>(() =>
    soundManager.isAlarmRinging()
  );

  useEffect(() => {
    const handleSoundToggle = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsSoundOn(customEvent.detail);
      setIsMutedState(soundManager.isMuted());
    };

    const handleMutedChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsMutedState(customEvent.detail);
      setIsSoundOn(soundManager.isEnabled());
    };

    const handleVolumeChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setVolumeState(customEvent.detail);
      setIsSoundOn(soundManager.isEnabled());
      setIsMutedState(soundManager.isMuted());
    };

    const handleRingtoneChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setSelectedRingtoneId(customEvent.detail);
    };

    const handlePreviewChange = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>;
      setPreviewingId(customEvent.detail);
    };

    const handleAlarmStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsAlarmRinging(customEvent.detail);
    };

    window.addEventListener('gabarita_sound_toggled', handleSoundToggle);
    window.addEventListener('gabarita_muted_changed', handleMutedChange);
    window.addEventListener('gabarita_volume_changed', handleVolumeChange);
    window.addEventListener('gabarita_ringtone_changed', handleRingtoneChange);
    window.addEventListener('gabarita_preview_changed', handlePreviewChange);
    window.addEventListener('gabarita_alarm_state_changed', handleAlarmStateChange);

    return () => {
      window.removeEventListener('gabarita_sound_toggled', handleSoundToggle);
      window.removeEventListener('gabarita_muted_changed', handleMutedChange);
      window.removeEventListener('gabarita_volume_changed', handleVolumeChange);
      window.removeEventListener('gabarita_ringtone_changed', handleRingtoneChange);
      window.removeEventListener('gabarita_preview_changed', handlePreviewChange);
      window.removeEventListener('gabarita_alarm_state_changed', handleAlarmStateChange);
    };
  }, []);

  const toggleSound = useCallback(() => {
    const next = soundManager.toggleSound();
    setIsSoundOn(next);
    setIsMutedState(soundManager.isMuted());
    setVolumeState(soundManager.getVolume());
  }, []);

  const setVolume = useCallback((newVol: number) => {
    soundManager.setVolume(newVol);
    setVolumeState(soundManager.getVolume());
    setIsMutedState(soundManager.isMuted());
    setIsSoundOn(soundManager.isEnabled());
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    soundManager.setMuted(muted);
    setIsMutedState(muted);
    setIsSoundOn(soundManager.isEnabled());
  }, []);

  const selectRingtone = useCallback((id: string) => {
    soundManager.setSelectedRingtoneId(id);
    setSelectedRingtoneId(id);
  }, []);

  const togglePreview = useCallback((id: string) => {
    soundManager.togglePreview(id);
  }, []);

  const stopPreview = useCallback(() => {
    soundManager.stopPreview();
  }, []);

  const unlockAudio = useCallback(() => {
    soundManager.unlockAudioAndPermissions();
  }, []);

  const triggerAlarm = useCallback(
    (modeOrOptions?: 'session' | 'break' | TriggerAlarmOptions) => {
      if (typeof modeOrOptions === 'string') {
        const isBreak = modeOrOptions === 'break';
        soundManager.startContinuousAlarm({
          title: isBreak ? 'Pausa Concluída!' : 'Tempo Finalizado!',
          subtitle: isBreak
            ? 'Sua pausa terminou. Hora de retomar os estudos!'
            : 'Parabéns! Seu tempo de foco foi concluído.',
        });
      } else {
        soundManager.startContinuousAlarm(modeOrOptions);
      }
    },
    []
  );

  const stopAlarm = useCallback(() => {
    soundManager.stopAlarm();
  }, []);

  const selectedRingtone: AlarmRingtone =
    ALARM_RINGTONES.find((r) => r.id === selectedRingtoneId) || ALARM_RINGTONES[0];

  return {
    isSoundOn,
    isMuted,
    volume,
    toggleSound,
    setVolume,
    setMuted,
    selectedRingtoneId,
    selectedRingtone,
    selectRingtone,
    previewingId,
    togglePreview,
    stopPreview,
    isAlarmRinging,
    unlockAudio,
    triggerAlarm,
    stopAlarm,
    ringtones: ALARM_RINGTONES,
  };
}
