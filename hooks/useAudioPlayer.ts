import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudioPlayer, AudioPlayer } from 'expo-audio';

export interface UseAudioPlayerCustomReturn {
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  playbackRate: number;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seekTo: (seconds: number) => void;
  setRate: (rate: number) => void;
  isLoaded: boolean;
}

export function useAudioPlayerCustom(
  audioSource?: string | null,
  initialDuration: number = 0
): UseAudioPlayerCustomReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);

  const player = useAudioPlayer(audioSource || null);
  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (initialDuration > 0) {
      setDuration(initialDuration);
    }
  }, [initialDuration]);

  useEffect(() => {
    if (!player || !audioSource) {
      setIsLoaded(false);
      setIsPlaying(false);
      return;
    }

    setIsLoaded(true);

    // Sync player state
    const updateStatus = () => {
      try {
        if (player.currentTime !== undefined) {
          setCurrentTime(player.currentTime);
        }
        if (player.duration && player.duration > 0) {
          setDuration(player.duration);
        }
        setIsPlaying(player.playing);
      } catch (e) {
        // Player might be updating or unmounted
      }
    };

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(updateStatus, 250);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [player, audioSource]);

  const play = useCallback(() => {
    if (!player) return;
    try {
      player.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Error playing audio:', err);
    }
  }, [player]);

  const pause = useCallback(() => {
    if (!player) return;
    try {
      player.pause();
      setIsPlaying(false);
    } catch (err) {
      console.warn('Error pausing audio:', err);
    }
  }, [player]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (!player) return;
      try {
        const clamped = Math.max(0, Math.min(seconds, duration || 9999));
        player.seekTo(clamped);
        setCurrentTime(clamped);
      } catch (err) {
        console.warn('Error seeking audio:', err);
      }
    },
    [player, duration]
  );

  const setRate = useCallback(
    (rate: number) => {
      if (!player) return;
      try {
        setPlaybackRate(rate);
        if (typeof (player as any).setPlaybackRate === 'function') {
          (player as any).setPlaybackRate(rate);
        }
      } catch (err) {
        console.warn('Error setting playback rate:', err);
      }
    },
    [player]
  );

  return {
    isPlaying,
    currentTime,
    duration: duration || initialDuration,
    playbackRate,
    play,
    pause,
    togglePlayPause,
    seekTo,
    setRate,
    isLoaded,
  };
}

export default useAudioPlayerCustom;
