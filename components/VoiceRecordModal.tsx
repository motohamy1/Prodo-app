import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import useVoiceRecorder from '@/hooks/useVoiceRecorder';
import VoiceWaveform from './VoiceWaveform';

interface VoiceRecordModalProps {
  visible: boolean;
  onClose: () => void;
  onFinishRecording: (result: { uri: string; duration: number }) => Promise<void> | void;
  isArabic?: boolean;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const VoiceRecordModal: React.FC<VoiceRecordModalProps> = ({
  visible,
  onClose,
  onFinishRecording,
  isArabic = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const { t } = useTranslation(isArabic ? 'ar' : 'en');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isRecording,
    isPaused,
    duration,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  useEffect(() => {
    if (visible) {
      startRecording();
    } else {
      cancelRecording();
    }
  }, [visible]);

  const handleStopAndSave = async () => {
    try {
      setIsProcessing(true);
      const res = await stopRecording();
      if (res && res.uri) {
        await onFinishRecording(res);
      }
      onClose();
    } catch (err) {
      console.warn('Error saving voice recording:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    await cancelRecording();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 100}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Header Status */}
          <View style={styles.header}>
            <View style={styles.recordingDot} />
            <Text style={[styles.title, { color: colors.text }]}>
              {isPaused ? t.paused : t.recording}
            </Text>
          </View>

          {/* Time Counter */}
          <Text style={[styles.durationText, { color: colors.text }]}>
            {formatDuration(duration)}
          </Text>

          {/* Waveform Visualizer */}
          <View style={styles.waveformContainer}>
            <VoiceWaveform isListening={isRecording && !isPaused} audioLevel={audioLevel} />
          </View>

          {/* Action Buttons */}
          <View style={[styles.buttonsRow, isArabic && { flexDirection: 'row-reverse' }]}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
              ]}
              onPress={handleCancel}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Pause / Resume Button */}
            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
              ]}
              onPress={isPaused ? resumeRecording : pauseRecording}
              disabled={isProcessing}
            >
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>

            {/* Finish & Save Button */}
            <TouchableOpacity
              style={[
                styles.finishButton,
                { backgroundColor: colors.primary || '#6366F1' },
              ]}
              onPress={handleStopAndSave}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark" size={26} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationText: {
    fontSize: 38,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 6,
  },
  waveformContainer: {
    width: '100%',
    height: 90,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 14,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default VoiceRecordModal;
