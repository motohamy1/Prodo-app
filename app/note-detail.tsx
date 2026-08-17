import { createNotesStyles } from '@/assets/styles/notes.styles';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { scheduleReminderNotification } from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useMutation, useAction, useQuery } from 'convex/react';
import AudioPlayerCard from '@/components/AudioPlayerCard';
import VoiceWaveform from '@/components/VoiceWaveform';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import NoteAIChatSheet from '@/components/NoteAIChatSheet';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { AIChatMessage } from '@/types/voiceNote';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedWavyHeader from '@/components/AnimatedWavyHeader';

const NoteHeader = React.memo(({ 
  title, 
  setTitle, 
  formattedNoteDate, 
  isArabic, 
  colors, 
  styles 
}: { 
  title: string; 
  setTitle: (t: string) => void; 
  formattedNoteDate: string; 
  isArabic: boolean; 
  colors: any; 
  styles: any;
}) => {
  const [titleHeight, setTitleHeight] = React.useState(0);
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
      <TextInput
        style={[styles.titleInput, isArabic && { textAlign: 'right' }, { height: Math.max(44, titleHeight) }]}
        placeholder={isArabic ? 'عنوان الملاحظة' : 'Note Title'}
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
        blurOnSubmit={true}
        multiline={true}
        scrollEnabled={false}
        onContentSizeChange={(e) => setTitleHeight(e.nativeEvent.contentSize.height)}
      />
      <Text style={[styles.dateSubtitle, isArabic && { textAlign: 'right' }]}>{formattedNoteDate}</Text>
    </View>
  );
});
NoteHeader.displayName = 'NoteHeader';

export default function NoteDetailScreen() {
  const router = useRouter();
  const { id, isReminder, tag } = useLocalSearchParams<{ id: string; isReminder: string; tag?: string }>();
  const { colors, isDarkMode } = useTheme();
  const isDark = isDarkMode;
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const styles = useMemo(() => createNotesStyles(colors, isArabic), [colors, isArabic]);
  const insets = useSafeAreaInsets();

  // Note State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [noteTag, setNoteTag] = useState<string>(tag || '#work');
  const [dueDate, setDueDate] = useState<number>(0);
  const [isScheduleVisible, setScheduleVisible] = useState(isReminder === 'true');
  const [dateTimeConfirmed, setDateTimeConfirmed] = useState(false);

  const bodyInputRef = useRef<TextInput | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      (scrollViewRef.current as any)?.scrollToEnd?.({ animated: true });
    }, 100);
  };

  // Typography State
  const [activeFontSize, setActiveFontSize] = useState(17);
  const [activeFontFamily, setActiveFontFamily] = useState(Platform.OS === 'ios' ? 'System' : 'sans-serif');
  const [activeFontColor, setActiveFontColor] = useState(colors.text);
  const [activeFontWeight, setActiveFontWeight] = useState<'normal' | 'bold'>('normal');
  const [activeFontStyle, setActiveFontStyle] = useState<'normal' | 'italic'>('normal');

  type ActiveMenuType = 'none' | 'fontFamily' | 'fontSize' | 'color';
  const [activeMenu, setActiveMenu] = useState<ActiveMenuType>('none');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Custom Calendar State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Custom Exact Time state
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Voice & AI State
  const [isAIChatVisible, setAIChatVisible] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Native Voice Recorder Hook (Inline, No Disruptive Modals)
  const {
    isRecording,
    isPaused,
    duration: recordingDuration,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Queries & Mutations
  const existingNote = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : 'skip')?.find((t: any) => t._id === id);
  const addNote = useOfflineMutation(api.todos.addTodo, "todos:addTodo");
  const updateNote = useOfflineMutation(api.todos.updateTodo, "todos:updateTodo");
  const deleteNoteMutation = useOfflineMutation(api.todos.deleteTodo, "todos:deleteTodo");

  // Audio & AI Convex Actions
  const generateAudioUploadUrl = useMutation(api.audio.generateAudioUploadUrl);
  const attachAudioToNote = useMutation(api.audio.attachAudioToNote);
  const removeAudioFromNote = useMutation(api.audio.removeAudioFromNote);
  const transcribeAudioAction = useAction(api.audio.transcribeAudio);
  const generateNoteSummaryAction = useAction(api.aiNotes.generateNoteSummary);
  const extractActionItemsAction = useAction(api.aiNotes.extractActionItems);
  const chatWithNoteAction = useAction(api.aiNotes.chatWithNote);
  const convertActionItemsToTasks = useMutation(api.aiNotes.convertActionItemsToTasks);

  const audioUrl = useQuery(
    api.audio.getAudioUrl,
    existingNote?.audioStorageId ? { storageId: existingNote.audioStorageId } : 'skip'
  );
  
  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.text || '');
      setBody(existingNote.description || '');
      if (existingNote.hashtags && existingNote.hashtags.length > 0) {
        setNoteTag(existingNote.hashtags[0]);
      }
      if (existingNote.dueDate) {
        setDueDate(existingNote.dueDate);
        const d = new Date(existingNote.dueDate);
        setSelectedDate(d);
        setCurrentMonth(d);
        setSelectedTime(d);
        setScheduleVisible(true);
        setDateTimeConfirmed(true);
      }
    }
  }, [existingNote]);

  const handleSaveNote = async () => {
    const bodyStr = body.trim();
    if (!title.trim() && !bodyStr) {
      router.back();
      return;
    }
    
    if (userId) {
      try {
        if (!id) {
          await addNote({
            userId,
            text: title.trim() || 'Untitled',
            description: bodyStr,
            dueDate: isScheduleVisible ? (dueDate || Date.now()) : undefined,
            date: isScheduleVisible ? (dueDate || Date.now()) : Date.now(),
            status: 'not_started',
            type: isScheduleVisible ? 'reminder' : 'note',
            hashtags: [noteTag || '#work'],
          });
        } else {
          await updateNote({
            id: id as any,
            text: title.trim() || 'Untitled',
            description: bodyStr,
            dueDate: isScheduleVisible ? (dueDate || Date.now()) : 0,
            type: isScheduleVisible ? 'reminder' : 'note',
            hashtags: [noteTag || '#work'],
          });
        }
        // Schedule sound notification for reminders with future due dates
        if (isScheduleVisible) {
          const reminderDate = dueDate || Date.now();
          if (reminderDate > Date.now()) {
            await scheduleReminderNotification(
              title.trim() || 'Untitled',
              reminderDate,
              language
            );
          }
        }
      } catch (err) {
        console.warn('Failed to save note', err);
      }
    }
    router.back();
  };

  const handleDeleteNote = async () => {
    if (id) {
      try {
        await deleteNoteMutation({ id: id as any });
      } catch (err) {
        console.warn('Failed to delete note', err);
      }
    }
    router.back();
  };

  const formattedNoteDate = new Date(dueDate || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Audio Recording & Upload Handler
  const handleToggleRecording = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        await handleVoiceRecordingFinished(result);
      }
    } else {
      await startRecording();
    }
  };

  const handleVoiceRecordingFinished = async (result: { uri: string; duration: number }) => {
    if (!id || !userId) {
      Alert.alert(
        t.noteNotSavedYet || 'Please save the note first',
        t.saveNoteBeforeAudio || 'Save the note title once before recording audio to it.'
      );
      return;
    }

    try {
      setIsTranscribing(true);

      // 1. Get pre-signed Convex storage upload URL
      const uploadUrl = await generateAudioUploadUrl();

      // 2. Upload audio file binary directly to Convex storage
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, result.uri, {
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'Content-Type': 'audio/m4a',
        },
      });

      if (uploadResult.status !== 200) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }

      const { storageId } = JSON.parse(uploadResult.body);

      // 3. Attach audio metadata to Note record in Convex
      await attachAudioToNote({
        noteId: id as any,
        storageId,
        duration: Math.round(result.duration),
      });

      // 4. Trigger AI transcription asynchronously via action
      await transcribeAudioAction({
        noteId: id as any,
        storageId,
        languageHint: isArabic ? 'ar' : 'en',
      });
    } catch (err) {
      console.warn('Failed to upload/transcribe audio:', err);
      Alert.alert(t.audioUploadError || 'Audio Error', t.audioUploadErrorDesc || 'Failed to upload or transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDeleteAudio = async () => {
    if (!id) return;
    try {
      await removeAudioFromNote({ noteId: id as any });
    } catch (err) {
      console.warn('Failed to remove audio from note:', err);
    }
  };

  const handleRetryTranscribe = async () => {
    if (!id || !existingNote?.audioStorageId) return;
    try {
      setIsTranscribing(true);
      await transcribeAudioAction({
        noteId: id as any,
        storageId: existingNote.audioStorageId,
        languageHint: isArabic ? 'ar' : 'en',
      });
    } catch (err) {
      console.warn('Error retrying transcription:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  // AI Quick Actions
  const handleSummarizeNote = async () => {
    if (!id) return;
    try {
      setIsAILoading(true);
      const res = await generateNoteSummaryAction({
        noteId: id as any,
        language: isArabic ? 'ar' : 'en',
      });
      if (res.summary) {
        Alert.alert(
          t.aiSummary || 'AI Summary',
          res.summary,
          [
            { text: t.cancel, style: 'cancel' },
            {
              text: t.insertToNote || 'Insert into Note',
              onPress: () => {
                const header = isArabic ? '\n\n📝 **الملخص:**\n' : '\n\n📝 **Summary:**\n';
                setBody(prev => (prev ? prev + header + res.summary : header.trim() + '\n' + res.summary));
                scrollToBottom();
              },
            },
          ]
        );
      }
    } catch (err) {
      console.warn('Error generating AI summary:', err);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleExtractTasks = async () => {
    if (!id) return;
    try {
      setIsAILoading(true);
      const res = await extractActionItemsAction({
        noteId: id as any,
        language: isArabic ? 'ar' : 'en',
      });

      if (res.tasks && res.tasks.length > 0) {
        Alert.alert(
          t.aiTasksExtracted || 'Tasks Extracted',
          `${res.tasks.length} task(s) found:\n` +
            res.tasks.map((t) => `• ${t.text}`).join('\n') +
            '\n\nAdd them to your To-Do task list?',
          [
            { text: t.cancel, style: 'cancel' },
            {
              text: t.addToTodoList || 'Add to Tasks',
              onPress: async () => {
                await convertActionItemsToTasks({
                  noteId: id as any,
                  tasks: res.tasks,
                });
                Alert.alert(t.actionSuccess || 'Success', 'Tasks added to your To-Do board.');
              },
            },
          ]
        );
      }
    } catch (err) {
      console.warn('Error extracting action items:', err);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleExplainNote = async () => {
    if (!id) return;
    try {
      setIsAILoading(true);
      setAIChatVisible(true);
      await chatWithNoteAction({
        noteId: id as any,
        message: isArabic
          ? 'يرجى تقديم شرح وافٍ ومبسط للنقاط والمفاهيم الرئيسية في هذه الملاحظة.'
          : 'Please explain the main concepts and key points in this note in a clear, easy-to-understand way.',
        chatHistory: existingNote?.aiChatHistory || [],
        language: isArabic ? 'ar' : 'en',
      });
    } catch (err) {
      console.warn('Error in AI explain:', err);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSendAIChat = async (msg: string) => {
    if (!id) return;
    try {
      setIsAILoading(true);
      await chatWithNoteAction({
        noteId: id as any,
        message: msg,
        chatHistory: existingNote?.aiChatHistory || [],
        language: isArabic ? 'ar' : 'en',
      });
    } catch (err) {
      console.warn('Error in AI chat:', err);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleInsertToNote = (content: string) => {
    setBody(prev => (prev ? prev + '\n\n' + content : content));
    setAIChatVisible(false);
    scrollToBottom();
  };

  const handleInsertTranscript = () => {
    if (!existingNote?.transcript) return;
    setBody(prev => (prev ? prev + '\n\n' + existingNote.transcript : existingNote.transcript));
    scrollToBottom();
  };

  // --- Smart Body Change & List Auto-Continuation ---
  const handleBodyChange = useCallback((newText: string) => {
    // Detect single Enter key press to auto-continue lists or clear empty prefixes
    if (newText.length === body.length + 1) {
      const cursorPos = selection.start;
      if (newText[cursorPos] === '\n' || newText[cursorPos - 1] === '\n') {
        const beforeText = newText.slice(0, cursorPos);
        const lines = beforeText.split('\n');
        const lastLine = lines[lines.length - 2];

        if (lastLine !== undefined) {
          // 1. Checklist
          const checklistMatch = lastLine.match(/^(\s*)([☐☑]|- \[[ x]\])\s*(.*)$/);
          if (checklistMatch) {
            const [_, indent, marker, content] = checklistMatch;
            if (!content.trim()) {
              // Pressed Enter on empty checklist -> revert line to clean empty
              const linesAll = newText.split('\n');
              const finishedLineIdx = lines.length - 2;
              linesAll[finishedLineIdx] = indent;
              setBody(linesAll.join('\n'));
              return;
            } else {
              // Continue checklist item
              const afterText = newText.slice(cursorPos);
              setBody(beforeText + '☐ ' + afterText);
              return;
            }
          }

          // 2. Bullet list
          const bulletMatch = lastLine.match(/^(\s*)([•\-\*])\s*(.*)$/);
          if (bulletMatch) {
            const [_, indent, marker, content] = bulletMatch;
            if (!content.trim()) {
              const linesAll = newText.split('\n');
              const finishedLineIdx = lines.length - 2;
              linesAll[finishedLineIdx] = indent;
              setBody(linesAll.join('\n'));
              return;
            } else {
              const afterText = newText.slice(cursorPos);
              setBody(beforeText + '• ' + afterText);
              return;
            }
          }

          // 3. Numbered list
          const numberMatch = lastLine.match(/^(\s*)(\d+)\.\s*(.*)$/);
          if (numberMatch) {
            const [_, indent, numStr, content] = numberMatch;
            if (!content.trim()) {
              const linesAll = newText.split('\n');
              const finishedLineIdx = lines.length - 2;
              linesAll[finishedLineIdx] = indent;
              setBody(linesAll.join('\n'));
              return;
            } else {
              const nextNum = parseInt(numStr, 10) + 1;
              const afterText = newText.slice(cursorPos);
              setBody(beforeText + `${nextNum}. ` + afterText);
              return;
            }
          }

          // 4. Quote block
          const quoteMatch = lastLine.match(/^(\s*)>\s*(.*)$/);
          if (quoteMatch) {
            const [_, indent, content] = quoteMatch;
            if (!content.trim()) {
              const linesAll = newText.split('\n');
              const finishedLineIdx = lines.length - 2;
              linesAll[finishedLineIdx] = indent;
              setBody(linesAll.join('\n'));
              return;
            } else {
              const afterText = newText.slice(cursorPos);
              setBody(beforeText + '> ' + afterText);
              return;
            }
          }
        }
      }
    }
    setBody(newText);
  }, [body, selection]);

  // --- Line Info Helper for Cursor ---
  const getCurrentLineInfo = useCallback(() => {
    const pos = selection.start || 0;
    const before = body.slice(0, pos);
    const after = body.slice(pos);
    const lastNewlineBefore = before.lastIndexOf('\n');
    const lineStart = lastNewlineBefore === -1 ? 0 : lastNewlineBefore + 1;
    const nextNewlineAfter = after.indexOf('\n');
    const lineEnd = nextNewlineAfter === -1 ? body.length : pos + nextNewlineAfter;
    const lineText = body.slice(lineStart, lineEnd);
    return { lineStart, lineEnd, lineText, before, after };
  }, [body, selection]);

  // Current line analysis for active toolbar highlight states
  const currentLine = useMemo(() => {
    const pos = selection.start || 0;
    const before = body.slice(0, pos);
    const after = body.slice(pos);
    const lastNewlineBefore = before.lastIndexOf('\n');
    const lineStart = lastNewlineBefore === -1 ? 0 : lastNewlineBefore + 1;
    const nextNewlineAfter = after.indexOf('\n');
    const lineEnd = nextNewlineAfter === -1 ? body.length : pos + nextNewlineAfter;
    return body.slice(lineStart, lineEnd);
  }, [body, selection]);

  const isH1Active = currentLine.startsWith('# ');
  const isH2Active = currentLine.startsWith('## ');
  const isH3Active = currentLine.startsWith('### ');
  const isChecklistActive = currentLine.startsWith('☐ ') || currentLine.startsWith('☑ ');
  const isBulletActive = currentLine.startsWith('• ') || currentLine.startsWith('- ');
  const isNumberActive = /^\d+\.\s/.test(currentLine);
  const isQuoteActive = currentLine.startsWith('> ');

  // --- Toolbar Formatting Commands ---
  const toggleHeading = useCallback((level: 1 | 2 | 3) => {
    const { lineStart, lineEnd, lineText } = getCurrentLineInfo();
    const prefix = '#'.repeat(level) + ' ';
    const cleanText = lineText.replace(/^#{1,6}\s*/, '');
    let newLineText = '';
    if (lineText.startsWith(prefix)) {
      newLineText = cleanText;
    } else {
      newLineText = prefix + cleanText;
    }
    const newBody = body.slice(0, lineStart) + newLineText + body.slice(lineEnd);
    setBody(newBody);
  }, [body, getCurrentLineInfo]);

  const toggleChecklist = useCallback(() => {
    const { lineStart, lineEnd, lineText } = getCurrentLineInfo();
    let newLineText = '';
    if (lineText.startsWith('☐ ') || lineText.startsWith('☑ ')) {
      newLineText = lineText.slice(2);
    } else if (lineText.startsWith('• ')) {
      newLineText = '☐ ' + lineText.slice(2);
    } else {
      newLineText = '☐ ' + lineText;
    }
    const newBody = body.slice(0, lineStart) + newLineText + body.slice(lineEnd);
    setBody(newBody);
  }, [body, getCurrentLineInfo]);

  const toggleBulletList = useCallback(() => {
    const { lineStart, lineEnd, lineText } = getCurrentLineInfo();
    let newLineText = '';
    if (lineText.startsWith('• ')) {
      newLineText = lineText.slice(2);
    } else if (lineText.startsWith('☐ ') || lineText.startsWith('☑ ')) {
      newLineText = '• ' + lineText.slice(2);
    } else {
      newLineText = '• ' + lineText;
    }
    const newBody = body.slice(0, lineStart) + newLineText + body.slice(lineEnd);
    setBody(newBody);
  }, [body, getCurrentLineInfo]);

  const toggleNumberedList = useCallback(() => {
    const { lineStart, lineEnd, lineText } = getCurrentLineInfo();
    let newLineText = '';
    if (/^\d+\.\s/.test(lineText)) {
      newLineText = lineText.replace(/^\d+\.\s*/, '');
    } else {
      newLineText = '1. ' + lineText.replace(/^[•☐☑]\s*/, '');
    }
    const newBody = body.slice(0, lineStart) + newLineText + body.slice(lineEnd);
    setBody(newBody);
  }, [body, getCurrentLineInfo]);

  const toggleQuote = useCallback(() => {
    const { lineStart, lineEnd, lineText } = getCurrentLineInfo();
    let newLineText = '';
    if (lineText.startsWith('> ')) {
      newLineText = lineText.slice(2);
    } else {
      newLineText = '> ' + lineText;
    }
    const newBody = body.slice(0, lineStart) + newLineText + body.slice(lineEnd);
    setBody(newBody);
  }, [body, getCurrentLineInfo]);

  const insertInlineFormat = useCallback((wrapper: string) => {
    const start = selection.start || 0;
    const end = selection.end || 0;
    if (start !== end) {
      const selectedText = body.slice(start, end);
      const wrapped = `${wrapper}${selectedText}${wrapper}`;
      const newBody = body.slice(0, start) + wrapped + body.slice(end);
      setBody(newBody);
    } else {
      const newBody = body.slice(0, start) + `${wrapper}${wrapper}` + body.slice(start);
      setBody(newBody);
    }
  }, [body, selection]);

  const insertDivider = useCallback(() => {
    const start = selection.start || 0;
    const newBody = body.slice(0, start) + '\n---\n' + body.slice(start);
    setBody(newBody);
  }, [body, selection]);

  // Interactive Checklist toggle for any line index in body
  const checklistItems = useMemo(() => {
    const lines = body.split('\n');
    const items: { lineIndex: number; text: string; checked: boolean }[] = [];
    lines.forEach((l, idx) => {
      if (l.startsWith('☐ ')) {
        items.push({ lineIndex: idx, text: l.slice(2), checked: false });
      } else if (l.startsWith('☑ ')) {
        items.push({ lineIndex: idx, text: l.slice(2), checked: true });
      }
    });
    return items;
  }, [body]);

  const toggleCheckmarkAtLine = useCallback((targetLineIdx: number) => {
    const lines = body.split('\n');
    if (lines[targetLineIdx] !== undefined) {
      const line = lines[targetLineIdx];
      if (line.startsWith('☐ ')) {
        lines[targetLineIdx] = '☑ ' + line.slice(2);
      } else if (line.startsWith('☑ ')) {
        lines[targetLineIdx] = '☐ ' + line.slice(2);
      }
      setBody(lines.join('\n'));
    }
  }, [body]);

  // Calendar Helpers
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  
  const renderCalendarDays = () => {
    const cells = [];
    const isCurrentMonthSelected = selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const isActive = isCurrentMonthSelected && selectedDate.getDate() === i;
        cells.push(
          <TouchableOpacity 
            key={`day-${i}`} 
            style={[styles.dayCell, isActive && styles.dayCellActive]}
            onPress={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i))}
          >
            <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{i}</Text>
          </TouchableOpacity>
        );
    }
    return cells;
  };

  return (
    <SafeAreaView style={[styles.detailSafeArea, { flex: 1 }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1 }}>
          {/* Top Header Bar */}
          <AnimatedWavyHeader backgroundColor={colors.bg} waveHeight={10} contentStyle={{ paddingBottom: 2 }}>
            <View style={[styles.detailHeader, { paddingBottom: 6 }, isArabic && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity style={styles.detailHeaderBtn} onPress={handleSaveNote}>
                <Ionicons name="chevron-back" size={24} style={styles.detailHeaderBtnIcon} />
              </TouchableOpacity>
              
              <View style={styles.detailHeaderRight}>
                <TouchableOpacity 
                  style={[styles.detailHeaderBtn, isScheduleVisible && { backgroundColor: colors.warning + '20' }]} 
                  onPress={() => {
                    if (isScheduleVisible && dateTimeConfirmed) {
                      setDateTimeConfirmed(false);
                    } else {
                      setScheduleVisible(!isScheduleVisible);
                      setDateTimeConfirmed(false);
                    }
                  }}
                >
                   <Ionicons 
                     name={isScheduleVisible ? "alarm" : "alarm-outline"} 
                     size={22} 
                     color={isScheduleVisible ? colors.warning : colors.text} 
                   />
                </TouchableOpacity>

                {/* Voice Record Button in Header */}
                <TouchableOpacity 
                  style={[
                    styles.detailHeaderBtn,
                    isRecording && { backgroundColor: 'rgba(239, 68, 68, 0.18)' },
                    !isRecording && { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)' }
                  ]} 
                  onPress={handleToggleRecording}
                >
                   <Ionicons
                     name={isRecording ? "stop-circle" : "mic"}
                     size={20}
                     color={isRecording ? "#EF4444" : "#6366F1"}
                   />
                </TouchableOpacity>

                <TouchableOpacity style={styles.detailHeaderBtn} onPress={handleSaveNote}>
                   <Ionicons name="checkmark" size={24} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.detailHeaderBtn} onPress={() => {
                   if (id) handleDeleteNote();
                   else router.back();
                }}>
                   <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedWavyHeader>

          <ScrollView 
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          >
            {/* Note Title & Date */}
            <NoteHeader 
              title={title}
              setTitle={setTitle}
              formattedNoteDate={formattedNoteDate}
              isArabic={isArabic}
              colors={colors}
              styles={styles}
            />

            {/* Inline Active Voice Recording Bar */}
            {isRecording && (
              <View
                style={{
                  marginHorizontal: 24,
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.95)',
                  borderWidth: 1.5,
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)',
                  shadowColor: '#6366F1',
                  shadowOpacity: 0.15,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                <View
                  style={[
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                    },
                    isArabic && { flexDirection: 'row-reverse' },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 5,
                        backgroundColor: isPaused ? '#F59E0B' : '#EF4444',
                      }}
                    />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                      {isPaused
                        ? (isArabic ? 'متوقف مؤقتاً' : 'Paused')
                        : (isArabic ? 'جارِ التسجيل' : 'Recording')}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#6366F1' }}>
                      {formatRecordingTime(recordingDuration)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      onPress={isPaused ? resumeRecording : pauseRecording}
                      style={{
                        padding: 7,
                        borderRadius: 10,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <Ionicons
                        name={isPaused ? 'play' : 'pause'}
                        size={16}
                        color={colors.text}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={cancelRecording}
                      style={{
                        padding: 7,
                        borderRadius: 10,
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      }}
                    >
                      <Ionicons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleToggleRecording}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 10,
                        backgroundColor: '#6366F1',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                        {isArabic ? 'تم' : 'Done'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Real-time Dynamic Waveform */}
                <View style={{ height: 65, justifyContent: 'center', alignItems: 'center' }}>
                  <VoiceWaveform isListening={!isPaused} audioLevel={audioLevel} />
                </View>
              </View>
            )}

            {/* Audio Player Card (if audio attached) */}
            {(existingNote?.audioStorageId || audioUrl) && !isRecording && (
              <View style={{ paddingHorizontal: 24 }}>
                <AudioPlayerCard
                  audioUrl={audioUrl}
                  duration={existingNote?.audioDuration || 0}
                  transcriptStatus={existingNote?.transcriptStatus || (isTranscribing ? 'transcribing' : 'none')}
                  transcript={existingNote?.transcript}
                  onDeleteAudio={handleDeleteAudio}
                  onRetryTranscribe={handleRetryTranscribe}
                  isArabic={isArabic}
                />
              </View>
            )}

            {/* Live Transcribing Indicator */}
            {(existingNote?.transcriptStatus === 'transcribing' || isTranscribing) && !existingNote?.transcript && (
              <View
                style={{
                  marginHorizontal: 24,
                  marginBottom: 16,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#6366F1' }}>
                  {isArabic ? 'جارِ تفريغ التسجيل بالذكاء الاصطناعي...' : 'Transcribing audio with AI...'}
                </Text>
              </View>
            )}

            {/* Transcript Box */}
            {existingNote?.transcript && (
              <View
                style={{
                  marginHorizontal: 24,
                  marginBottom: 16,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.9)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <View
                  style={[
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    },
                    isArabic && { flexDirection: 'row-reverse' },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="document-text-outline" size={16} color="#6366F1" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                      {t.transcript}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleInsertTranscript}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                    }}
                  >
                    <Ionicons name="add" size={14} color="#6366F1" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366F1' }}>
                      {t.insertToNote}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 20,
                    color: colors.textMuted,
                    textAlign: isArabic ? 'right' : 'left',
                  }}
                >
                  {existingNote.transcript}
                </Text>
              </View>
            )}
            
            {/* Reminder Picker */}
            {isScheduleVisible && (
              <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                {dateTimeConfirmed ? (
                  <TouchableOpacity
                    onPress={() => setDateTimeConfirmed(false)}
                    style={{
                      flexDirection: isArabic ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: 10,
                      backgroundColor: colors.warning + '18',
                      borderWidth: 1,
                      borderColor: colors.warning + '50',
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Ionicons name="alarm" size={18} color={colors.warning} />
                    <Text style={{ color: colors.warning, fontWeight: '700', fontSize: 14 }}>
                      {new Date(dueDate).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {'  '}
                      {new Date(dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Ionicons name="pencil-outline" size={14} color={colors.warning} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.inlineReminderHeader}>
                    <Text style={[styles.inlineReminderTitle, isArabic && { textAlign: 'right' }]}>
                      {isArabic ? 'موعد التذكير' : 'Reminder Schedule'}
                    </Text>
                    
                    <View style={styles.calendarCard}>
                      <View style={[styles.calendarHeader, isArabic && { flexDirection: 'row-reverse' }]}>
                        <TouchableOpacity onPress={prevMonth}>
                          <Ionicons name="chevron-back" size={20} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.calendarTitle}>
                          {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                        <TouchableOpacity onPress={nextMonth}>
                          <Ionicons name="chevron-forward" size={20} color={colors.text} />
                        </TouchableOpacity>
                      </View>

                      <View style={[styles.weekDaysRow, isArabic && { flexDirection: 'row-reverse' }]}>
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                          <Text key={d} style={styles.weekDayText}>{d}</Text>
                        ))}
                      </View>

                      <View style={[styles.daysGrid, isArabic && { flexDirection: 'row-reverse' }]}>
                        {renderCalendarDays()}
                      </View>
                    </View>

                    <View style={[styles.timePresetsRow, isArabic && { flexDirection: 'row-reverse' }, { alignItems: 'center', marginTop: 16 }]}>
                      {Platform.OS === 'ios' ? (
                        <DateTimePicker
                          value={selectedTime}
                          mode="time"
                          display="spinner"
                          themeVariant={isDarkMode ? 'dark' : 'light'}
                          style={{ flex: 1, height: 100 }}
                          onChange={(e, d) => {
                            if (d) {
                              setSelectedTime(d);
                              const finalDate = new Date(selectedDate);
                              finalDate.setHours(d.getHours(), d.getMinutes(), 0, 0);
                              setDueDate(finalDate.getTime());
                            }
                          }}
                        />
                      ) : (
                        <>
                          <TouchableOpacity 
                            style={[styles.timePresetBtn, { backgroundColor: colors.bg, flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 12 }]}
                            onPress={() => setShowTimePicker(true)}
                          >
                            <Ionicons name="time-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
                            <Text style={[styles.timePresetMain, { color: colors.text, fontSize: 18 }]}>
                              {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </TouchableOpacity>
                          {showTimePicker && (
                            <DateTimePicker
                              value={selectedTime}
                              mode="time"
                              display="default"
                              themeVariant={isDarkMode ? 'dark' : 'light'}
                              is24Hour={true}
                              onChange={(e, d) => {
                                 setShowTimePicker(false);
                                 if (d) {
                                   setSelectedTime(d);
                                   const finalDate = new Date(selectedDate);
                                   finalDate.setHours(d.getHours(), d.getMinutes(), 0, 0);
                                   setDueDate(finalDate.getTime());
                                 }
                              }}
                            />
                          )}
                        </>
                      )}
                    </View>

                    {/* Confirm button */}
                    <TouchableOpacity
                      onPress={() => {
                        const finalDate = new Date(selectedDate);
                        finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
                        setDueDate(finalDate.getTime());
                        setDateTimeConfirmed(true);
                      }}
                      style={{
                        marginTop: 16,
                        backgroundColor: colors.warning,
                        borderRadius: 12,
                        paddingVertical: 12,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>
                        {isArabic ? 'تأكيد الموعد' : 'Confirm Date & Time'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Interactive Checklist Quick Toggle Bar (if note has checklists) */}
            {checklistItems.length > 0 && (
              <View style={styles.interactiveChecklistStrip}>
                <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }, isArabic && { flexDirection: 'row-reverse' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted }}>
                    {isArabic ? 'قوائم المهام التفاعلية' : 'Interactive Checklist'}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }}>
                    {checklistItems.filter(i => i.checked).length} / {checklistItems.length}
                  </Text>
                </View>
                {checklistItems.map((item) => (
                  <TouchableOpacity
                    key={`chk-${item.lineIndex}`}
                    onPress={() => toggleCheckmarkAtLine(item.lineIndex)}
                    style={[
                      {
                        flexDirection: isArabic ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingVertical: 4,
                      },
                    ]}
                  >
                    <View style={[styles.checkbox, item.checked && styles.checkboxChecked, { width: 18, height: 18, borderRadius: 5 }]}>
                      {item.checked && <Ionicons name="checkmark" size={13} color={colors.primaryText} />}
                    </View>
                    <Text
                      style={[
                        {
                          fontSize: 14,
                          color: colors.text,
                          flex: 1,
                          textAlign: isArabic ? 'right' : 'left',
                        },
                        item.checked && { textDecorationLine: 'line-through', opacity: 0.5 },
                      ]}
                      numberOfLines={1}
                    >
                      {item.text || (isArabic ? 'مهمة بدون عنوان' : 'Empty task')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Unified Note Body Editor Container */}
            <TouchableOpacity 
              activeOpacity={1} 
              style={styles.editorContainer}
              onPress={() => {
                bodyInputRef.current?.focus();
              }}
            >
              <TextInput
                ref={bodyInputRef}
                style={[
                  styles.mainBodyInput,
                  {
                    fontSize: activeFontSize,
                    lineHeight: Math.round(activeFontSize * 1.55),
                    fontFamily: activeFontFamily === 'System' ? undefined : activeFontFamily,
                    color: activeFontColor,
                    fontWeight: activeFontWeight,
                    fontStyle: activeFontStyle,
                    textAlign: isArabic ? 'right' : 'left',
                  }
                ]}
                placeholder={isArabic ? 'ابدأ في كتابة ملاحظتك هنا...\n• استخدم الشريط أدناه لإضافة العناوين، القوائم، أو المهام.' : 'Start typing your note here...\n• Use the toolbar below to add Headings, Checklists, Bullets, or Formats.'}
                placeholderTextColor={colors.textMuted + '60'}
                value={body}
                onChangeText={handleBodyChange}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                multiline={true}
                scrollEnabled={false}
                textAlignVertical="top"
                blurOnSubmit={false}
              />
            </TouchableOpacity>
          </ScrollView>

          {/* AI Quick Actions Bar */}
          <View
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.98)',
              borderTopWidth: StyleSheet.hairlineWidth,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 8,
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                onPress={handleSummarizeNote}
                disabled={isAILoading}
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.1)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.2)',
                }}
              >
                <Ionicons name="sparkles" size={13} color="#6366F1" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#6366F1' }}>
                  {t.aiSummarize}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExtractTasks}
                disabled={isAILoading}
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.2)',
                }}
              >
                <Ionicons name="checkbox-outline" size={13} color="#10B981" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>
                  {t.aiExtractTasks}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExplainNote}
                disabled={isAILoading}
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.1)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.2)',
                }}
              >
                <Ionicons name="bulb-outline" size={13} color="#F59E0B" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#F59E0B' }}>
                  {t.aiExplain}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAIChatVisible(true)}
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                }}
              >
                <Ionicons name="chatbubbles-outline" size={13} color={colors.text} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>
                  {t.aiAsk}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleRecording}
                style={{
                  flexDirection: isArabic ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: isRecording
                    ? 'rgba(239, 68, 68, 0.25)'
                    : isDark
                    ? 'rgba(239, 68, 68, 0.18)'
                    : 'rgba(239, 68, 68, 0.1)',
                  borderWidth: 1,
                  borderColor: isRecording
                    ? '#EF4444'
                    : isDark
                    ? 'rgba(239, 68, 68, 0.35)'
                    : 'rgba(239, 68, 68, 0.2)',
                }}
              >
                <Ionicons
                  name={isRecording ? 'stop-circle' : 'mic-outline'}
                  size={13}
                  color="#EF4444"
                />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>
                  {isRecording ? (isArabic ? 'إيقاف وحفظ' : 'Stop & Save') : t.voiceRecord}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Rich Formatting Toolbar */}
          <View style={[
            styles.toolbarWrapper,
            {
              backgroundColor: colors.bg,
              paddingBottom: keyboardHeight > 0 ? 8 : insets.bottom + 8,
              borderTopWidth: 1,
              borderColor: colors.border,
            }
          ]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                { flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
              ]}
            >
              {/* Headings */}
              <TouchableOpacity 
                style={[styles.toolbarIconBtn, isH1Active && styles.toolbarIconBtnActive]} 
                onPress={() => toggleHeading(1)}
              >
                <Text style={{ fontSize: 15, fontWeight: '800', color: isH1Active ? colors.primary : colors.surfaceText }}>H1</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.toolbarIconBtn, isH2Active && styles.toolbarIconBtnActive]} 
                onPress={() => toggleHeading(2)}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: isH2Active ? colors.primary : colors.surfaceText }}>H2</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.toolbarIconBtn, isH3Active && styles.toolbarIconBtnActive]} 
                onPress={() => toggleHeading(3)}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: isH3Active ? colors.primary : colors.surfaceText }}>H3</Text>
              </TouchableOpacity>

              <View style={{ width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 2 }} />

              {/* Checklist */}
              <TouchableOpacity 
                style={[styles.toolbarIconBtn, isChecklistActive && styles.toolbarIconBtnActive]} 
                onPress={toggleChecklist}
              >
                <Ionicons 
                  name={isChecklistActive ? "checkbox" : "checkbox-outline"} 
                  size={20} 
                  color={isChecklistActive ? colors.primary : colors.surfaceText} 
                />
              </TouchableOpacity>

              {/* Bullet List */}
              <TouchableOpacity 
                style={[styles.toolbarIconBtn, isBulletActive && styles.toolbarIconBtnActive]} 
                onPress={toggleBulletList}
              >
                <Ionicons 
                  name="list-outline" 
                  size={20} 
                  color={isBulletActive ? colors.primary : colors.surfaceText} 
                />
              </TouchableOpacity>

              {/* Numbered List */}
              <TouchableOpacity 
                style={[styles.toolbarIconBtn, isNumberActive && styles.toolbarIconBtnActive]} 
                onPress={toggleNumberedList}
              >
                <Ionicons 
                  name="reorder-four-outline" 
                  size={20} 
                  color={isNumberActive ? colors.primary : colors.surfaceText} 
                />
              </TouchableOpacity>

              {/* Quote */}
              <TouchableOpacity 
                style={[styles.toolbarIconBtn, isQuoteActive && styles.toolbarIconBtnActive]} 
                onPress={toggleQuote}
              >
                <Ionicons 
                  name="chatbox-ellipses-outline" 
                  size={19} 
                  color={isQuoteActive ? colors.primary : colors.surfaceText} 
                />
              </TouchableOpacity>

              <View style={{ width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 2 }} />

              {/* Bold */}
              <TouchableOpacity 
                style={styles.toolbarIconBtn} 
                onPress={() => insertInlineFormat('**')}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: colors.surfaceText }}>B</Text>
              </TouchableOpacity>

              {/* Italic */}
              <TouchableOpacity 
                style={styles.toolbarIconBtn} 
                onPress={() => insertInlineFormat('*')}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', fontStyle: 'italic', color: colors.surfaceText }}>I</Text>
              </TouchableOpacity>

              {/* Strikethrough */}
              <TouchableOpacity 
                style={styles.toolbarIconBtn} 
                onPress={() => insertInlineFormat('~~')}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', textDecorationLine: 'line-through', color: colors.surfaceText }}>S</Text>
              </TouchableOpacity>

              {/* Divider */}
              <TouchableOpacity 
                style={styles.toolbarIconBtn} 
                onPress={insertDivider}
              >
                <Ionicons name="remove-outline" size={22} color={colors.surfaceText} />
              </TouchableOpacity>

              <View style={{ width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 2 }} />

              {/* Font Size */}
              <TouchableOpacity 
                onPress={() => setActiveMenu('fontSize')} 
                style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surface }}
              >
                <Text style={{ color: colors.surfaceText, fontSize: 13, fontWeight: '700' }}>{activeFontSize}pt</Text>
              </TouchableOpacity>

              {/* Color */}
              <TouchableOpacity onPress={() => setActiveMenu('color')}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: activeFontColor, borderWidth: 2, borderColor: colors.border }} />
              </TouchableOpacity>

              {/* Font Family */}
              <TouchableOpacity 
                onPress={() => setActiveMenu('fontFamily')}
                style={[styles.toolbarIconBtn]}
              >
                <Ionicons name="text" size={18} color={colors.surfaceText} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* AI Assistant Interactive Chat Bottom Sheet */}
      <NoteAIChatSheet
        visible={isAIChatVisible}
        onClose={() => setAIChatVisible(false)}
        noteTitle={title || 'Untitled Note'}
        chatHistory={existingNote?.aiChatHistory || []}
        onSendMessage={handleSendAIChat}
        onInsertToNote={handleInsertToNote}
        isArabic={isArabic}
        isLoading={isAILoading}
      />

      {/* Action Menu Bottom Sheet (Font Size, Font Family, Color) */}
      <Modal
        visible={activeMenu !== 'none'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveMenu('none')}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setActiveMenu('none')}
        >
          <View style={[styles.modalContent, { marginTop: 'auto', marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeMenu === 'fontFamily' && (isArabic ? 'اختر نوع الخط' : 'Select Font Family')}
                {activeMenu === 'fontSize' && (isArabic ? 'اختر حجم الخط' : 'Select Font Size')}
                {activeMenu === 'color' && (isArabic ? 'اختر لون النص' : 'Select Text Color')}
              </Text>
              <TouchableOpacity onPress={() => setActiveMenu('none')}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activeMenu === 'fontFamily' && ['System', 'Baskerville', 'Georgia', 'serif', 'sans-serif'].map(f => (
                <TouchableOpacity key={f} onPress={() => { setActiveFontFamily(f); setActiveMenu('none'); }} style={{ padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.text, fontFamily: f === 'System' ? undefined : f, fontSize: 18 }}>{f}</Text>
                </TouchableOpacity>
              ))}

              {activeMenu === 'fontSize' && [14, 16, 17, 18, 20, 22, 24, 28].map(s => (
                <TouchableOpacity key={s} onPress={() => { setActiveFontSize(s); setActiveMenu('none'); }} style={{ padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.text, fontSize: s, fontWeight: activeFontSize === s ? '700' : '400' }}>{s}pt</Text>
                </TouchableOpacity>
              ))}

              {activeMenu === 'color' && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, padding: 16, justifyContent: 'space-around' }}>
                  {[colors.text, colors.primary, colors.danger, colors.success, colors.warning, colors.border, colors.textMuted, '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'].map(c => (
                    <TouchableOpacity 
                      key={c} 
                      onPress={() => { setActiveFontColor(c); setActiveMenu('none'); }} 
                      style={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: 24, 
                        backgroundColor: c, 
                        borderWidth: 3, 
                        borderColor: activeFontColor === c ? colors.primary : 'transparent',
                        shadowColor: colors.text,
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 3
                      }} 
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
