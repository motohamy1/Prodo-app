import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  AudioRecorder,
} from 'expo-audio';

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in seconds
  audioLevel: number; // 0.0 to 1.0 for waveform animation
  uri: string | null;
  startRecording: () => Promise<boolean>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<{ uri: string; duration: number } | null>;
  cancelRecording: () => Promise<void>;
  hasPermission: boolean | null;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [uri, setUri] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const timerRef = useRef<any>(null);
  const durationRef = useRef(0);

  // Check initial permissions
  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.getRecordingPermissionsAsync();
        setHasPermission(status.granted);
      } catch (err) {
        console.warn('Error checking audio permissions:', err);
      }
    })();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setHasPermission(status.granted);
      if (!status.granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Please enable microphone access in your settings to record audio notes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
      return status.granted;
    } catch (err) {
      console.warn('Failed to request recording permission:', err);
      return false;
    }
  };

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestPermission();
      if (!granted) return false;

      // Reset state
      setDuration(0);
      durationRef.current = 0;
      setUri(null);
      setIsPaused(false);

      await recorder.prepareToRecordAsync();
      recorder.record();

      setIsRecording(true);

      // Start duration & smooth 100ms metering level timer
      if (timerRef.current) clearInterval(timerRef.current);
      let elapsedMs = 0;
      timerRef.current = setInterval(() => {
        elapsedMs += 100;
        if (elapsedMs % 1000 === 0) {
          durationRef.current += 1;
          setDuration(durationRef.current);
        }

        // Generate dynamic organic audio level variations for waveforms
        const fluctuating = 0.3 + Math.sin(elapsedMs / 200) * 0.25 + Math.random() * 0.45;
        setAudioLevel(Math.max(0.2, Math.min(1.2, fluctuating)));
      }, 100);

      return true;
    } catch (err) {
      console.error('Error starting recording:', err);
      setIsRecording(false);
      return false;
    }
  }, [recorder]);

  const pauseRecording = useCallback(async () => {
    try {
      if (!isRecording || isPaused) return;
      recorder.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err) {
      console.warn('Error pausing recording:', err);
    }
  }, [recorder, isRecording, isPaused]);

  const resumeRecording = useCallback(async () => {
    try {
      if (!isRecording || !isPaused) return;
      recorder.record();
      setIsPaused(false);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
        setAudioLevel(0.35 + Math.random() * 0.55);
      }, 1000);
    } catch (err) {
      console.warn('Error resuming recording:', err);
    }
  }, [recorder, isRecording, isPaused]);

  const stopRecording = useCallback(async (): Promise<{ uri: string; duration: number } | null> => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const currentDuration = durationRef.current;
      await recorder.stop();

      const recordingUri = recorder.uri;
      setIsRecording(false);
      setIsPaused(false);
      setUri(recordingUri || null);

      if (recordingUri) {
        return {
          uri: recordingUri,
          duration: Math.max(1, currentDuration),
        };
      }
      return null;
    } catch (err) {
      console.error('Error stopping recording:', err);
      setIsRecording(false);
      setIsPaused(false);
      return null;
    }
  }, [recorder]);

  const cancelRecording = useCallback(async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      await recorder.stop();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      durationRef.current = 0;
      setUri(null);
    } catch (err) {
      console.warn('Error cancelling recording:', err);
      setIsRecording(false);
    }
  }, [recorder]);

  return {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    uri,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    hasPermission,
  };
}

export default useVoiceRecorder;
