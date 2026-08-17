import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import useAudioPlayerCustom from '@/hooks/useAudioPlayer';
import { TranscriptStatus } from '@/types/voiceNote';

interface AudioPlayerCardProps {
  audioUrl?: string | null;
  duration?: number; // in seconds
  transcriptStatus?: TranscriptStatus;
  transcript?: string;
  onDeleteAudio?: () => void;
  onRetryTranscribe?: () => void;
  isArabic?: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const PLAYBACK_SPEEDS = [1.0, 1.25, 1.5, 2.0];

export const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({
  audioUrl,
  duration = 0,
  transcriptStatus = 'none',
  transcript,
  onDeleteAudio,
  onRetryTranscribe,
  isArabic = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const { t } = useTranslation(isArabic ? 'ar' : 'en');
  const [speedIndex, setSpeedIndex] = useState(0);

  const {
    isPlaying,
    currentTime,
    duration: playerDuration,
    playbackRate,
    togglePlayPause,
    seekTo,
    setRate,
  } = useAudioPlayerCustom(audioUrl, duration);

  const totalDuration = playerDuration > 0 ? playerDuration : duration;
  const progressPercent = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;

  const handleCycleSpeed = () => {
    const nextIdx = (speedIndex + 1) % PLAYBACK_SPEEDS.length;
    setSpeedIndex(nextIdx);
    setRate(PLAYBACK_SPEEDS[nextIdx]);
  };

  const confirmDelete = () => {
    Alert.alert(
      t.delete,
      t.deleteAudioConfirm,
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.delete, style: 'destructive', onPress: onDeleteAudio },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(241, 245, 249, 0.9)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      {/* Top row: Play/Pause button, time progress, speed toggle & delete */}
      <View style={[styles.mainRow, isArabic && { flexDirection: 'row-reverse' }]}>
        {/* Play / Pause Circular Button */}
        <TouchableOpacity
          style={[
            styles.playButton,
            { backgroundColor: colors.primary || '#6366F1' },
          ]}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color="#FFFFFF"
            style={{ marginLeft: isPlaying ? 0 : 2 }}
          />
        </TouchableOpacity>

        {/* Middle: Title & Time Counter */}
        <View style={[styles.infoBlock, isArabic && { alignItems: 'flex-end' }]}>
          <Text style={[styles.audioLabel, { color: colors.text }]}>
            {t.voiceRecord}
          </Text>
          <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </Text>
        </View>

        {/* Right Actions: Speed Pill & Delete */}
        <View style={[styles.actionsRow, isArabic && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity
            style={[
              styles.speedBadge,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
            onPress={handleCycleSpeed}
          >
            <Text style={[styles.speedText, { color: colors.text }]}>
              {PLAYBACK_SPEEDS[speedIndex]}x
            </Text>
          </TouchableOpacity>

          {onDeleteAudio && (
            <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Interactive Progress Bar */}
      <TouchableOpacity
        style={styles.progressBarBg}
        activeOpacity={1}
        onPress={(e) => {
          const { locationX } = e.nativeEvent;
          // Approximate container width = 300
          const ratio = Math.max(0, Math.min(1, locationX / 300));
          seekTo(ratio * totalDuration);
        }}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progressPercent * 100}%`,
              backgroundColor: colors.primary || '#6366F1',
            },
          ]}
        />
      </TouchableOpacity>

      {/* Transcription Status Row */}
      {transcriptStatus === 'transcribing' && (
        <View style={[styles.transcribingRow, isArabic && { flexDirection: 'row-reverse' }]}>
          <ActivityIndicator size="small" color={colors.primary || '#6366F1'} />
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            {t.transcribing}
          </Text>
        </View>
      )}

      {transcriptStatus === 'failed' && (
        <View style={[styles.transcribingRow, isArabic && { flexDirection: 'row-reverse' }]}>
          <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
          <Text style={[styles.statusText, { color: '#EF4444' }]}>
            {t.transcriptionFailed}
          </Text>
          {onRetryTranscribe && (
            <TouchableOpacity onPress={onRetryTranscribe} style={styles.retryButton}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                Retry
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBlock: {
    flex: 1,
    paddingHorizontal: 12,
  },
  audioLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeLabel: {
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  speedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 6,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  transcribingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
  },
  retryButton: {
    marginLeft: 6,
  },
});

export default AudioPlayerCard;
