import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { AIChatMessage } from '@/types/voiceNote';

interface NoteAIChatSheetProps {
  visible: boolean;
  onClose: () => void;
  noteTitle: string;
  chatHistory: AIChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onInsertToNote?: (content: string) => void;
  onAddExtractedTasks?: (tasks: string[]) => void;
  isArabic?: boolean;
  isLoading?: boolean;
}

export const NoteAIChatSheet: React.FC<NoteAIChatSheetProps> = ({
  visible,
  onClose,
  noteTitle,
  chatHistory = [],
  onSendMessage,
  onInsertToNote,
  onAddExtractedTasks,
  isArabic = false,
  isLoading = false,
}) => {
  const { colors, isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const { t } = useTranslation(isArabic ? 'ar' : 'en');
  const [inputMessage, setInputMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [visible, chatHistory, isLoading]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const msg = inputMessage.trim();
    setInputMessage('');
    await onSendMessage(msg);
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    Alert.alert(t.actionSuccess || 'Copied', 'Response copied to clipboard.');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={[styles.header, isArabic && { flexDirection: 'row-reverse' }]}>
            <View style={styles.headerInfo}>
              <View style={styles.headerBadge}>
                <Ionicons name="sparkles" size={14} color="#6366F1" />
                <Text style={[styles.aiTitle, { color: colors.text }]}>
                  {t.aiAssistant}
                </Text>
              </View>
              <Text
                style={[styles.noteSubtitle, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {noteTitle}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Messages Scroll Area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingVertical: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {chatHistory.length === 0 && !isLoading && (
              <View style={styles.emptyPrompt}>
                <Ionicons name="chatbubbles-outline" size={36} color={colors.textMuted} />
                <Text style={[styles.emptyPromptTitle, { color: colors.text }]}>
                  {isArabic ? 'اسأل المساعد الذكي' : 'Ask Note AI Anything'}
                </Text>
                <Text style={[styles.emptyPromptSub, { color: colors.textMuted }]}>
                  {isArabic
                    ? 'يمكنك مناقشة الملاحظة، طلب شرح لأي نقطة، أو تلخيص واستخراج المهام.'
                    : 'Discuss this note, ask for explanations, or extract actionable tasks.'}
                </Text>
              </View>
            )}

            {chatHistory.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={index}
                  style={[
                    styles.messageRow,
                    isUser ? styles.userRow : styles.modelRow,
                    isArabic && (isUser ? { flexDirection: 'row-reverse' } : { flexDirection: 'row' }),
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? {
                            backgroundColor: colors.primary || '#6366F1',
                            shadowColor: colors.primary || '#6366F1',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 6,
                            elevation: 2,
                          }
                        : {
                            backgroundColor: isDark
                              ? 'rgba(30, 41, 59, 0.85)'
                              : 'rgba(241, 245, 249, 0.95)',
                            borderColor: isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.06)',
                            borderWidth: 1,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        {
                          color: isUser
                            ? (colors.primaryText || (isDark ? '#181326' : '#FFFFFF'))
                            : colors.text,
                          fontWeight: isUser ? '600' : '400',
                        },
                        isArabic && { textAlign: 'right' },
                      ]}
                    >
                      {msg.content}
                    </Text>

                    {/* Action buttons on AI responses */}
                    {!isUser && (
                      <View
                        style={[
                          styles.bubbleActions,
                          isArabic && { flexDirection: 'row-reverse' },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.bubbleActionBtn}
                          onPress={() => handleCopy(msg.content)}
                        >
                          <Ionicons name="copy-outline" size={13} color={colors.textMuted} />
                          <Text style={[styles.bubbleActionText, { color: colors.textMuted }]}>
                            {t.share || 'Copy'}
                          </Text>
                        </TouchableOpacity>

                        {onInsertToNote && (
                          <TouchableOpacity
                            style={styles.bubbleActionBtn}
                            onPress={() => onInsertToNote(msg.content)}
                          >
                            <Ionicons name="add-circle-outline" size={13} color="#6366F1" />
                            <Text style={[styles.bubbleActionText, { color: '#6366F1' }]}>
                              {t.insertToNote}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {isLoading && (
              <View style={[styles.messageRow, styles.modelRow]}>
                <View
                  style={[
                    styles.bubble,
                    {
                      backgroundColor: isDark
                        ? 'rgba(30, 41, 59, 0.85)'
                        : 'rgba(241, 245, 249, 0.95)',
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    },
                  ]}
                >
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '500' }}>
                    {t.aiThinking}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Input Area */}
          <View
            style={[
              styles.inputRow,
              {
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
              isArabic && { flexDirection: 'row-reverse' },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                },
                isArabic && { textAlign: 'right' },
              ]}
              placeholder={t.askAboutNote}
              placeholderTextColor={colors.textMuted}
              value={inputMessage}
              onChangeText={setInputMessage}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputMessage.trim() ? colors.primary || '#6366F1' : isDark ? '#334155' : '#E2E8F0',
                },
              ]}
              onPress={handleSend}
              disabled={!inputMessage.trim() || isLoading}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={inputMessage.trim() ? (colors.primaryText || '#FFFFFF') : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    height: '75%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150, 150, 150, 0.4)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  headerInfo: {
    flex: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  noteSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyPromptSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  modelRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  bubbleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bubbleActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NoteAIChatSheet;
