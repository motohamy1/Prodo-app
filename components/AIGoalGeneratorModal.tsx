import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import LivePress from '@/components/LivePress';
import { VoiceRecordModal } from '@/components/VoiceRecordModal';
import { GoalTemplateCard, GoalTemplateItem } from '@/components/GoalTemplateCard';
import { SEED_TEMPLATES } from '@/convex/aiGoals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MilestoneItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface DraftGoal {
  id: string;
  text: string;
  description?: string;
  category?: string;
  color?: string;
  icon?: string;
  milestones: MilestoneItem[];
}

interface DraftSection {
  categoryId: string;
  title: string;
  goals: DraftGoal[];
}

interface DraftAchievement {
  id: string;
  text: string;
  category?: string;
}

interface GeneratedPlan {
  templateId: string;
  templateName: string;
  themeTitle: string;
  motivationalQuote: string;
  sections: DraftSection[];
  targetAchievements?: DraftAchievement[];
}

interface AIGoalGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  year: number;
  month?: number; // 0-11 or undefined for full year
  userId: string;
  isArabic?: boolean;
  onPlanApplied?: () => void;
}

export const AIGoalGeneratorModal: React.FC<AIGoalGeneratorModalProps> = ({
  visible,
  onClose,
  year,
  month,
  userId,
  isArabic = false,
  onPlanApplied,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation(isArabic ? 'ar' : 'en');
  const isYearly = month === undefined;

  // Convex actions and queries
  const templatesData = useQuery(api.aiGoals.getTemplates) || SEED_TEMPLATES;
  const generatePlanAction = useAction(api.aiGoals.generateMonthlyPlan);
  const refinePlanAction = useAction(api.aiGoals.refineMonthlyPlan);
  const saveBlueprintMut = useMutation(api.aiGoals.saveMonthlyBlueprint);
  const generateAudioUploadUrl = useMutation(api.audio.generateAudioUploadUrl);
  const transcribeAudioAction = useAction(api.audio.transcribeAudio);

  // States
  const [step, setStep] = useState<'prompt' | 'generating' | 'review'>('prompt');
  const [promptText, setPromptText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('life_pillars');
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const templateScrollRef = useRef<ScrollView>(null);

  // Reset when modal becomes visible
  useEffect(() => {
    if (visible) {
      setStep('prompt');
      setPromptText('');
      setGeneratedPlan(null);
      setRefinementInput('');
      if (templatesData.length > 0) {
        setSelectedTemplateId(templatesData[0].templateId);
      }
    }
  }, [visible]);

  // Quick Inspiration Chips (Adapted for Year vs Month)
  const inspirationChips = isArabic
    ? isYearly
      ? [
          '🚀 بناء وتدشين مشروع تجاري',
          '🏃‍♂️ إنهاء ماراثون 42 كم ولياقة حديدية',
          '📚 قراءة 24 كتاباً تخصصياً',
          '💰 ادخار واستثمار 10,000 دولار',
          '🌟 تعلم مهارة الذكاء الاصطناعي',
          '🧘‍♂️ روتين يومي وانضباط ذهني مستمر',
        ]
      : [
          '🚀 إطلاق تطبيق MVP',
          '💪 رياضة ولياقة عالية',
          '📚 قراءة كتابين في التطوير',
          '💰 ادخار واستثمار ذكي',
          '✨ توازن ونوم منتظم',
          '💼 ترقية مهنية وإنجاز عملي',
        ]
    : isYearly
    ? [
        '🚀 Launch Startup & $50k ARR',
        '🏃‍♂️ Run Full 42km Marathon',
        '📚 Read 24 Transformative Books',
        '💰 Save & Invest $10,000',
        '🌟 Master AI & Mobile Engineering',
        '🧘‍♂️ Solid Morning Routine & Habits',
      ]
    : [
        '🚀 Launch MVP App',
        '💪 50km Run & Fitness',
        '📚 Read 2 Tech Books',
        '💰 Save $1,000 Budget',
        '✨ Work-Life & Deep Sleep',
        '💼 Career Promotion Win',
      ];

  const handleSelectInspiration = (chipText: string) => {
    const cleanText = chipText.replace(/^[^\s]+\s/, '');
    if (!promptText.trim()) {
      setPromptText(cleanText);
    } else {
      setPromptText((prev) => `${prev}, ${cleanText}`);
    }
  };

  // Random Template Picker
  const handleRandomTemplate = () => {
    if (!templatesData || templatesData.length === 0) return;
    const filtered = templatesData.filter((t) => t.templateId !== selectedTemplateId);
    const pool = filtered.length > 0 ? filtered : templatesData;
    const randomPick = pool[Math.floor(Math.random() * pool.length)];
    setSelectedTemplateId(randomPick.templateId);

    // Scroll to template
    const index = templatesData.findIndex((t) => t.templateId === randomPick.templateId);
    if (index >= 0 && templateScrollRef.current) {
      templateScrollRef.current.scrollTo({ x: index * 294, animated: true });
    }
  };

  // Voice recording finish handler
  const handleFinishVoiceRecording = async (result: { uri: string; duration: number }) => {
    try {
      setIsTranscribing(true);
      const uploadUrl = await generateAudioUploadUrl();
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, result.uri, {
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.BINARY_CONTENT,
        headers: { 'Content-Type': 'audio/m4a' },
      });

      if (uploadResult.status !== 200) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }

      const { storageId } = JSON.parse(uploadResult.body);
      const transcribeRes = await transcribeAudioAction({
        storageId,
        languageHint: isArabic ? 'ar' : 'en',
      });

      if (transcribeRes?.transcript) {
        const transText = transcribeRes.transcript.trim();
        setPromptText((prev) => (prev ? `${prev}\n${transText}` : transText));
      }
    } catch (err) {
      console.warn('Voice transcription failed:', err);
      Alert.alert(
        isArabic ? 'خطأ في التسجيل' : 'Transcription Error',
        isArabic ? 'تعذر تحويل الصوت إلى نص. يرجى المحاولة ثانية.' : 'Failed to transcribe voice note.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // Generate Plan Handler
  const handleGeneratePlan = async () => {
    if (!promptText.trim()) {
      Alert.alert(
        isArabic ? 'أدخل أهدافك' : 'Enter Your Goals',
        isArabic
          ? 'يرجى كتابة أو تسجيل بعض الأهداف والنقاط التي ترغب في تحقيقها هذا الشهر.'
          : 'Please enter or record some thoughts on what you want to achieve this month.'
      );
      return;
    }

    try {
      setStep('generating');
      setGeneratingStatus(
        isArabic ? 'جاري تحليل رغباتك وأهدافك...' : 'Analyzing your aspirations...'
      );

      const statusTimer = setTimeout(() => {
        setGeneratingStatus(
          isArabic ? 'صياغة النتائج والمحطات المرحلية...' : 'Structuring milestones & outcomes...'
        );
      }, 1800);

      const res: any = await generatePlanAction({
        userPrompt: promptText,
        templateId: selectedTemplateId,
        month,
        year,
        language: isArabic ? 'ar' : 'en',
      });

      clearTimeout(statusTimer);

      // Normalize generated plan into structured editable draft
      const normalizedSections: DraftSection[] = (res.sections || []).map((sec: any, sIdx: number) => {
        const matchedTemplate: any = templatesData.find((t: any) => t.templateId === selectedTemplateId);
        const catInfo = matchedTemplate?.categories?.find((c: any) => c.id === sec.categoryId);
        const templatePalette = [
          matchedTemplate?.accent || matchedTemplate?.color || '#EA580C',
          matchedTemplate?.accentSecondary || matchedTemplate?.gradientColors?.[1] || '#2563EB',
          ...(matchedTemplate?.categories?.map((c: any) => c.color).filter(Boolean) || []),
          '#059669',
          '#7C3AED',
          '#D97706',
        ];
        const sectionColor = catInfo?.color || templatePalette[sIdx % templatePalette.length];
        const sectionIcon = catInfo?.icon || matchedTemplate?.icon || 'flag-outline';

        return {
          categoryId: sec.categoryId || `cat_${sIdx}`,
          title: sec.title || (catInfo ? (isArabic ? catInfo.titleAr || catInfo.title : catInfo.title) : 'Goals'),
          goals: (sec.goals || []).map((g: any, gIdx: number) => ({
            id: `goal_${sIdx}_${gIdx}_${Date.now()}`,
            text: g.text || '',
            description: g.description || '',
            category: sec.title,
            color: sectionColor,
            icon: sectionIcon,
            milestones: (g.milestones || []).map((mText: string, mIdx: number) => ({
              id: `ms_${sIdx}_${gIdx}_${mIdx}`,
              text: mText,
              isCompleted: false,
            })),
          })),
        };
      });

      setGeneratedPlan({
        templateId: res.templateId || selectedTemplateId,
        templateName: res.templateName || 'Blueprint',
        themeTitle: res.themeTitle || (isArabic ? 'خطة الشهر' : 'Monthly Blueprint'),
        motivationalQuote: res.motivationalQuote || '',
        sections: normalizedSections,
      });

      setStep('review');
    } catch (err) {
      console.error('Plan generation failed:', err);
      Alert.alert(
        isArabic ? 'فشل التوليد' : 'Generation Failed',
        isArabic
          ? 'حدث خطأ أثناء توليد خطة الأهداف بالذكاء الاصطناعي. يرجى المحاولة مجدداً.'
          : 'Could not generate AI goals plan. Please try again.'
      );
      setStep('prompt');
    }
  };

  // Refine Plan Handler
  const handleRefinePlan = async () => {
    if (!refinementInput.trim() || !generatedPlan) return;
    try {
      setIsRefining(true);
      const refined: any = await refinePlanAction({
        currentPlanJson: JSON.stringify(generatedPlan),
        instruction: refinementInput.trim(),
        language: isArabic ? 'ar' : 'en',
      });

      if (refined && refined.sections) {
        setGeneratedPlan((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            themeTitle: refined.themeTitle || prev.themeTitle,
            motivationalQuote: refined.motivationalQuote || prev.motivationalQuote,
            sections: refined.sections.map((sec: any, sIdx: number) => ({
              categoryId: sec.categoryId || `sec_${sIdx}`,
              title: sec.title || 'Category',
              goals: (sec.goals || []).map((g: any, gIdx: number) => ({
                id: `ref_goal_${sIdx}_${gIdx}_${Date.now()}`,
                text: g.text || '',
                description: g.description || '',
                category: sec.title,
                color: prev.sections[sIdx]?.goals[0]?.color || '#6366F1',
                icon: prev.sections[sIdx]?.goals[0]?.icon || 'flag-outline',
                milestones: (g.milestones || []).map((m: any, mIdx: number) => ({
                  id: `ref_ms_${sIdx}_${gIdx}_${mIdx}`,
                  text: typeof m === 'string' ? m : m.text || '',
                  isCompleted: false,
                })),
              })),
            })),
          };
        });
        setRefinementInput('');
      }
    } catch (err) {
      console.warn('Refinement failed:', err);
      Alert.alert(
        isArabic ? 'خطأ في التعديل' : 'Refinement Error',
        isArabic ? 'تعذر تطبيق التعديلات. يرجى المحاولة ثانية.' : 'Failed to refine plan with AI.'
      );
    } finally {
      setIsRefining(false);
    }
  };

  // Inline Goal Operations in Review Studio
  const handleUpdateGoalText = (sectionIdx: number, goalIdx: number, newText: string) => {
    if (!generatedPlan) return;
    const updated = { ...generatedPlan };
    updated.sections[sectionIdx].goals[goalIdx].text = newText;
    setGeneratedPlan(updated);
  };

  const handleDeleteGoal = (sectionIdx: number, goalIdx: number) => {
    if (!generatedPlan) return;
    const updated = { ...generatedPlan };
    updated.sections[sectionIdx].goals.splice(goalIdx, 1);
    setGeneratedPlan(updated);
  };

  const handleAddGoalToSection = (sectionIdx: number) => {
    if (!generatedPlan) return;
    const updated = { ...generatedPlan };
    const sec = updated.sections[sectionIdx];
    sec.goals.push({
      id: `new_goal_${Date.now()}`,
      text: isArabic ? 'هدف جديد...' : 'New goal...',
      category: sec.title,
      color: sec.goals[0]?.color || '#6366F1',
      icon: sec.goals[0]?.icon || 'flag-outline',
      milestones: [],
    });
    setGeneratedPlan(updated);
  };

  const handleAddMilestone = (sectionIdx: number, goalIdx: number, text: string) => {
    if (!generatedPlan || !text.trim()) return;
    const updated = { ...generatedPlan };
    const goal = updated.sections[sectionIdx].goals[goalIdx];
    goal.milestones.push({
      id: `ms_${Date.now()}`,
      text: text.trim(),
      isCompleted: false,
    });
    setGeneratedPlan(updated);
  };

  const handleDeleteMilestone = (sectionIdx: number, goalIdx: number, msIdx: number) => {
    if (!generatedPlan) return;
    const updated = { ...generatedPlan };
    updated.sections[sectionIdx].goals[goalIdx].milestones.splice(msIdx, 1);
    setGeneratedPlan(updated);
  };

  // Save Final Blueprint to Convex Database
  const handleSaveAndApply = async () => {
    if (!generatedPlan || !userId) return;
    try {
      setIsSaving(true);

      const allGoalsToSave: any[] = [];
      generatedPlan.sections.forEach((sec) => {
        sec.goals.forEach((g) => {
          if (g.text.trim()) {
            allGoalsToSave.push({
              text: g.text.trim(),
              description: g.description?.trim() || undefined,
              category: sec.title,
              color: g.color,
              icon: g.icon,
              milestones: g.milestones,
            });
          }
        });
      });

      await saveBlueprintMut({
        userId,
        year,
        month,
        templateId: generatedPlan.templateId,
        themeTitle: generatedPlan.themeTitle,
        motivationalQuote: generatedPlan.motivationalQuote || undefined,
        goals: allGoalsToSave,
        achievements: [],
      });

      onPlanApplied?.();
      onClose();
    } catch (err) {
      console.error('Failed to save blueprint:', err);
      Alert.alert(
        isArabic ? 'خطأ في الحفظ' : 'Save Error',
        isArabic ? 'تعذر حفظ خطة الأهداف في قاعدة البيانات.' : 'Failed to save goals plan to database.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const activeTemplate = templatesData.find((t) => t.templateId === selectedTemplateId) || templatesData[0];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: isDarkMode ? '#282836' : '#E5E7EB' },
            isArabic && styles.rowReverse,
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="sparkles" size={18} color="#EA580C" />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {step === 'review'
                  ? isArabic
                    ? 'استوديو تعديل الخطة'
                    : 'Goal Blueprint Studio'
                  : isArabic
                  ? 'مهندس الأهداف بالذكاء الاصطناعي'
                  : 'AI Goal Architect'}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {year} • {isArabic ? (isYearly ? 'خطة العام الكامل' : `الشهر ${(month ?? 0) + 1}`) : (isYearly ? 'Annual Plan' : `Month ${(month ?? 0) + 1}`)}
            </Text>
          </View>

          <View style={{ width: 36 }} />
        </View>

        {/* ─── STEP 1: Prompt & Template Selection ─────────────────────────── */}
        {step === 'prompt' && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* AI Hero Banner */}
            <View
              style={[
                styles.heroBanner,
                {
                  backgroundColor: isDarkMode ? '#1E1E28' : '#FFF7ED',
                  borderColor: isDarkMode ? '#EA580C30' : '#FFEDD5',
                },
              ]}
            >
              <View style={[styles.heroRow, isArabic && styles.rowReverse]}>
                <View style={styles.heroSparkleCircle}>
                  <Ionicons name="bulb-outline" size={22} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroTitle, { color: isDarkMode ? '#FED7AA' : '#9A3412', textAlign: isArabic ? 'right' : 'left' }]}>
                    {isArabic ? 'تحدث مع الذكاء الاصطناعي بلغتك الطبيعية' : 'Speak or write what you wish to achieve'}
                  </Text>
                  <Text style={[styles.heroDesc, { color: isDarkMode ? '#D1D5DB' : '#78350F', textAlign: isArabic ? 'right' : 'left' }]}>
                    {isArabic
                      ? isYearly
                        ? 'اكتب أو سجل صوتك برؤيتك وأهدافك الكبرى لهذا العام، وسيقوم الذكاء الاصطناعي بتنظيمها في إطار استراتيجي راقٍ.'
                        : 'اكتب أو سجل صوتك بما ترغب في إنجازه، وسيقوم الذكاء الاصطناعي بصياغتها في القالب الهندسي المختار مع المحطات المرحلية.'
                      : isYearly
                      ? 'Share your annual vision and ambitions. AI will synthesize them into strategic pillars, milestones, and categories.'
                      : 'Share your focus areas and ambitions. AI will synthesize them into measurable milestones and categories.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Natural Language Prompt Input Box */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text, textAlign: isArabic ? 'right' : 'left' }]}>
                {isArabic
                  ? isYearly
                    ? `ما هي رؤيتك وأهدافك الكبرى لعام ${year}؟`
                    : 'ما هي تطلعاتك وأولوياتك لهذا الشهر؟'
                  : isYearly
                  ? `Your Grand Vision & Goals for ${year}`
                  : 'Your Monthly Intentions & Focus'}
              </Text>
              {promptText.length > 0 && (
                <TouchableOpacity onPress={() => setPromptText('')}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                    {isArabic ? 'مسح' : 'Clear'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDarkMode ? '#2D2D3E' : '#E5E7EB',
                },
              ]}
            >
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    textAlign: isArabic ? 'right' : 'left',
                  },
                ]}
                placeholder={
                  isArabic
                    ? isYearly
                      ? 'مثال: إطلاق مشروعي الخاص، الجري 500 كم، قراءة 20 كتاباً، وتوفير 15,000 ريال...'
                      : 'مثال: أريد إنهاء تطبيق الهاتف، الجري 40 كم، قراءة كتابين، وتوفير 1500 ريال...'
                    : isYearly
                    ? 'e.g. Launch my SaaS startup, run 500km total, read 20 books, save $10,000...'
                    : 'e.g. Finish mobile app MVP, run 40km, read 2 architecture books, and save $1,000...'
                }
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={promptText}
                onChangeText={setPromptText}
              />

              {/* Action bar inside input: Voice Mic Button */}
              <View style={[styles.inputBottomBar, isArabic && styles.rowReverse]}>
                <TouchableOpacity
                  style={[styles.voiceBtn, { backgroundColor: '#EA580C18' }]}
                  onPress={() => setVoiceModalVisible(true)}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? (
                    <ActivityIndicator size="small" color="#EA580C" />
                  ) : (
                    <>
                      <Ionicons name="mic" size={18} color="#EA580C" />
                      <Text style={[styles.voiceBtnText, { color: '#EA580C' }]}>
                        {isArabic ? 'تسجيل صوتي' : 'Speak Voice'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {promptText.length} {isArabic ? 'حرف' : 'chars'}
                </Text>
              </View>
            </View>

            {/* Quick Inspiration Chips */}
            <View style={{ marginTop: 12, marginBottom: 24 }}>
              <Text style={[styles.chipsLabel, { color: colors.textMuted, textAlign: isArabic ? 'right' : 'left' }]}>
                {isArabic ? 'أفكار سريعة للإلهام:' : 'Quick inspiration tags:'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingTop: 6 }}
              >
                {inspirationChips.map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.inspirationChip,
                      {
                        backgroundColor: isDarkMode ? '#22222E' : '#F3F4F6',
                        borderColor: isDarkMode ? '#333345' : '#E5E7EB',
                      },
                    ]}
                    onPress={() => handleSelectInspiration(chip)}
                  >
                    <Text style={[styles.inspirationChipText, { color: colors.text }]}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ─── Template Selector Section ──────────────────────────────── */}
            <View style={[styles.sectionHeaderRow, isArabic && styles.rowReverse]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {isArabic ? 'اختر القالب الهندسي' : 'Select Goal Framework'}
                </Text>
                <Text
                  style={[styles.sectionSubtitle, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {isArabic
                    ? 'سيتم تنظيم وتوزيع أهدافك في هذا الهيكل'
                    : 'AI will map your goals into this framework structure'}
                </Text>
              </View>

              {/* Random / Surprise Me Button */}
              <TouchableOpacity
                style={[
                  styles.randomBtn,
                  { backgroundColor: isDarkMode ? '#2A221E' : '#FFF7ED', borderColor: '#EA580C40' },
                ]}
                onPress={handleRandomTemplate}
              >
                <Ionicons name="dice-outline" size={16} color="#EA580C" />
                <Text style={[styles.randomBtnText, { color: '#EA580C' }]}>
                  {isArabic ? 'قالب عشوائي' : 'Surprise Me'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Swipeable Templates Carousel */}
            <ScrollView
              ref={templateScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 2 }}
              snapToInterval={304}
              decelerationRate="fast"
            >
              {templatesData.map((tpl) => (
                <GoalTemplateCard
                  key={tpl.templateId}
                  template={tpl}
                  isSelected={selectedTemplateId === tpl.templateId}
                  onSelect={() => setSelectedTemplateId(tpl.templateId)}
                  isArabic={isArabic}
                  cardWidth={290}
                />
              ))}
            </ScrollView>

            {/* Selected Template Highlights */}
            {activeTemplate && (
              <View
                style={[
                  styles.activeTemplateBanner,
                  {
                    backgroundColor: isDarkMode ? '#1E1E28' : '#F9FAFB',
                    borderColor: isDarkMode ? '#2D2D3E' : '#E5E7EB',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Ionicons name="sparkles-outline" size={14} color="#EA580C" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                    {isArabic ? 'النمط الهيكلي والجمالي المختار:' : 'Selected Framework Archetype:'}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, textAlign: isArabic ? 'right' : 'left' }}>
                  {isArabic
                    ? 'سيتم صياغة أهدافك المحددة ضمن هذا الهيكل الجمالي والأقسام المناسبة لها:'
                    : 'Your specific goals will be shaped into this visual style with tailored milestones:'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {activeTemplate.categories?.map((cat: any) => (
                    <View key={cat.id} style={[styles.miniCatChip, { backgroundColor: (cat.color || '#6366F1') + '15' }]}>
                      <View style={[styles.miniCatDot, { backgroundColor: cat.color || '#6366F1' }]} />
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>
                        {isArabic ? cat.titleAr || cat.title : cat.title}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Bottom Generate Button */}
            <View style={{ marginTop: 24, marginBottom: 40 }}>
              <LivePress
                style={[styles.generateBtn, { backgroundColor: '#EA580C' }]}
                onPress={handleGeneratePlan}
                pressScale={0.97}
              >
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>
                  {isArabic ? 'توليد خطة الشهر بالذكاء الاصطناعي' : 'Generate Monthly Blueprint'}
                </Text>
              </LivePress>
            </View>
          </ScrollView>
        )}

        {/* ─── STEP 2: Generating Loading State ─────────────────────────────── */}
        {step === 'generating' && (
          <View style={styles.generatingCenter}>
            <View style={styles.generatingPulseCircle}>
              <Ionicons name="sparkles" size={38} color="#EA580C" />
            </View>
            <ActivityIndicator size="large" color="#EA580C" style={{ marginVertical: 20 }} />
            <Text style={[styles.generatingTitle, { color: colors.text }]}>
              {isArabic ? 'جاري بناء خطتك الشهرية...' : 'Building Your Monthly Plan...'}
            </Text>
            <Text style={[styles.generatingStatus, { color: colors.textMuted }]}>{generatingStatus}</Text>
          </View>
        )}

        {/* ─── STEP 3: Review & Live Editable Studio ───────────────────────── */}
        {step === 'review' && generatedPlan && (
          <View style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={styles.reviewScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Theme & Quote Header Card */}
              <View
                style={[
                  styles.themeHeroCard,
                  {
                    backgroundColor: isDarkMode ? '#1E1E28' : '#FFF7ED',
                    borderColor: '#EA580C35',
                  },
                ]}
              >
                <View style={[styles.themePill, { backgroundColor: '#EA580C20' }]}>
                  <Ionicons name="rocket-outline" size={14} color="#EA580C" />
                  <Text style={[styles.themePillText, { color: '#EA580C' }]}>
                    {generatedPlan.templateName}
                  </Text>
                </View>

                <TextInput
                  style={[
                    styles.themeTitleInput,
                    { color: colors.text, textAlign: isArabic ? 'right' : 'left' },
                  ]}
                  value={generatedPlan.themeTitle}
                  onChangeText={(txt) => setGeneratedPlan({ ...generatedPlan, themeTitle: txt })}
                  placeholder={isArabic ? 'عنوان وشعار الشهر...' : 'Monthly theme title...'}
                  placeholderTextColor={colors.textMuted}
                />

                {generatedPlan.motivationalQuote ? (
                  <TextInput
                    style={[
                      styles.themeQuoteInput,
                      { color: isDarkMode ? '#D1D5DB' : '#78350F', textAlign: isArabic ? 'right' : 'left' },
                    ]}
                    value={generatedPlan.motivationalQuote}
                    onChangeText={(txt) =>
                      setGeneratedPlan({ ...generatedPlan, motivationalQuote: txt })
                    }
                    placeholder={isArabic ? 'عبارة تحفيزية...' : 'Motivational quote...'}
                    placeholderTextColor={colors.textMuted}
                    multiline
                  />
                ) : null}
              </View>

              {/* Categorized Sections List */}
              {generatedPlan.sections.map((section, sIdx) => (
                <View
                  key={section.categoryId || sIdx}
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isDarkMode ? '#2D2D3E' : '#E5E7EB',
                    },
                  ]}
                >
                  {/* Section Title Header */}
                  <View style={[styles.sectionCardHeader, isArabic && styles.rowReverse]}>
                    <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                      <View
                        style={[
                          styles.secDot,
                          { backgroundColor: section.goals[0]?.color || '#EA580C' },
                        ]}
                      />
                      <Text style={[styles.secTitleText, { color: colors.text }]}>
                        {section.title}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addSmallBtn}
                      onPress={() => handleAddGoalToSection(sIdx)}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Section Goals */}
                  {section.goals.map((goal, gIdx) => (
                    <View
                      key={goal.id || gIdx}
                      style={[
                        styles.goalItemBox,
                        {
                          backgroundColor: isDarkMode ? '#1E1E28' : '#F9FAFB',
                          borderColor: isDarkMode ? '#2D2D3E' : '#EEF2F6',
                        },
                      ]}
                    >
                      <View style={[styles.goalHeaderRow, isArabic && styles.rowReverse]}>
                        <Ionicons name="flag" size={16} color={goal.color || '#EA580C'} />
                        <TextInput
                          style={[
                            styles.goalTextInput,
                            { color: colors.text, textAlign: isArabic ? 'right' : 'left' },
                          ]}
                          value={goal.text}
                          onChangeText={(txt) => handleUpdateGoalText(sIdx, gIdx, txt)}
                          multiline
                        />
                        <TouchableOpacity
                          onPress={() => handleDeleteGoal(sIdx, gIdx)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>

                      {/* Milestones Sub-checklist */}
                      {goal.milestones?.map((ms, msIdx) => (
                        <View
                          key={ms.id || msIdx}
                          style={[styles.milestoneRow, isArabic && styles.rowReverse]}
                        >
                          <Ionicons
                            name="radio-button-off"
                            size={14}
                            color={colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.milestoneText,
                              { color: colors.textMuted, textAlign: isArabic ? 'right' : 'left' },
                            ]}
                          >
                            {ms.text}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleDeleteMilestone(sIdx, gIdx, msIdx)}
                          >
                            <Ionicons name="close" size={14} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}

                      {/* Add Sub-Milestone Bar */}
                      <MilestoneAddInput
                        isArabic={isArabic}
                        colors={colors}
                        onAdd={(txt) => handleAddMilestone(sIdx, gIdx, txt)}
                      />
                    </View>
                  ))}
                </View>
              ))}



              {/* Conversational AI Refinement Box */}
              <View
                style={[
                  styles.refinementBox,
                  {
                    backgroundColor: isDarkMode ? '#1C1C24' : '#F9FAFB',
                    borderColor: isDarkMode ? '#2D2D3E' : '#E5E7EB',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="chatbox-ellipses-outline" size={16} color="#EA580C" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    {isArabic ? 'تعديل أو إضافة بالذكاء الاصطناعي:' : 'Ask AI to tweak this blueprint:'}
                  </Text>
                </View>

                <View style={[styles.refineInputRow, isArabic && styles.rowReverse]}>
                  <TextInput
                    style={[
                      styles.refineInput,
                      { color: colors.text, textAlign: isArabic ? 'right' : 'left' },
                    ]}
                    placeholder={
                      isArabic
                        ? 'مثال: أضف هدفاً إضافياً للبرمجة، خفف الأهداف الرياضية...'
                        : 'e.g. Add 2 more coding milestones, reduce fitness intensity...'
                    }
                    placeholderTextColor={colors.textMuted}
                    value={refinementInput}
                    onChangeText={setRefinementInput}
                    editable={!isRefining}
                  />
                  <TouchableOpacity
                    style={[styles.refineBtn, { backgroundColor: '#EA580C' }]}
                    onPress={handleRefinePlan}
                    disabled={isRefining || !refinementInput.trim()}
                  >
                    {isRefining ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons
                        name={isArabic ? 'arrow-back' : 'arrow-forward'}
                        size={18}
                        color="#FFFFFF"
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions: Apply & Back */}
            <View
              style={[
                styles.studioBottomBar,
                {
                  backgroundColor: colors.surface,
                  borderTopColor: isDarkMode ? '#282836' : '#E5E7EB',
                },
                isArabic && styles.rowReverse,
              ]}
            >
              <TouchableOpacity
                style={[styles.backBtn, { borderColor: colors.border }]}
                onPress={() => setStep('prompt')}
                disabled={isSaving}
              >
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                  {isArabic ? 'رجوع' : 'Back'}
                </Text>
              </TouchableOpacity>

              <LivePress
                style={[styles.applyBtn, { backgroundColor: '#EA580C' }]}
                onPress={handleSaveAndApply}
                disabled={isSaving}
                pressScale={0.97}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.applyBtnText}>
                      {isArabic ? 'حفظ وتطبيق الخطة على الشهر' : 'Apply & Save to Month'}
                    </Text>
                  </>
                )}
              </LivePress>
            </View>
          </View>
        )}

        {/* Voice Record Modal */}
        <VoiceRecordModal
          visible={voiceModalVisible}
          onClose={() => setVoiceModalVisible(false)}
          onFinishRecording={handleFinishVoiceRecording}
          isArabic={isArabic}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Sub-component for adding new milestone
const MilestoneAddInput: React.FC<{
  isArabic: boolean;
  colors: any;
  onAdd: (txt: string) => void;
}> = ({ isArabic, colors, onAdd }) => {
  const [text, setText] = useState('');
  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <View style={[styles.msAddRow, isArabic && styles.rowReverse]}>
      <TextInput
        style={[
          styles.msInput,
          { color: colors.text, textAlign: isArabic ? 'right' : 'left' },
        ]}
        placeholder={isArabic ? '+ إضافة مرحلة فرعية...' : '+ Add sub-milestone...'}
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAdd}
      />
      {text.trim().length > 0 && (
        <TouchableOpacity onPress={handleAdd} style={styles.msAddBtn}>
          <Ionicons name="add" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  heroSparkleCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EA580C20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  inputWrapper: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    minHeight: 120,
  },
  textInput: {
    fontSize: 15,
    fontWeight: '500',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#88888820',
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  voiceBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  charCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  chipsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  inspirationChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  inspirationChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  randomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    flexShrink: 0,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  randomBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  activeTemplateBanner: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  miniCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  miniCatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  generatingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  generatingPulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EA580C20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generatingTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  generatingStatus: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
  reviewScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  themeHeroCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  themeTitleInput: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  themeQuoteInput: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  secDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  secTitleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  addSmallBtn: {
    padding: 4,
  },
  goalItemBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingLeft: 12,
  },
  milestoneText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  msAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingLeft: 12,
  },
  msInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 2,
  },
  msAddBtn: {
    padding: 4,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  achievementInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  refinementBox: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 20,
  },
  refineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refineInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  refineBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studioBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
