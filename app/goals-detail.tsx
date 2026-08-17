import { api } from '@/convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedWavyHeader from '@/components/AnimatedWavyHeader';

const months_en = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const months_ar = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function GoalsDetailScreen() {
  const { year: y, month: m, day: d, title: tParam } = useLocalSearchParams<{
    year: string; month?: string; day?: string; title?: string;
  }>();
  const year = parseInt(y || '0');
  const month = m ? parseInt(m) : undefined;
  const day = d ? parseInt(d) : undefined;
  const pageTitle = tParam || 'Goals';

  const { colors } = useTheme();
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const router = useRouter();
  const months = isArabic ? months_ar : months_en;

  const isMonth = month !== undefined;
  const isDay = day !== undefined;

  // Query goals
  const yearGoals = useOfflineQuery<any[]>('yearlyGoals_detail', api.yearlyGoals.getGoals,
    userId && !isMonth ? { userId, year } : "skip") || [];
  const monthGoals = useOfflineQuery<any[]>('monthlyGoals_detail', api.yearlyGoals.getMonthGoals,
    userId && isMonth && !isDay ? { userId, year, month: month! } : "skip") || [];
  const dayGoals = useOfflineQuery<any[]>('dailyGoals_detail', api.yearlyGoals.getDayGoals,
    userId && isDay ? { userId, year, month: month!, day: day! } : "skip") || [];

  const goals = isDay ? dayGoals : isMonth ? monthGoals : yearGoals;

  // Query achievements
  const yearAchievements = useOfflineQuery<any[]>('yearlyAchievements_detail', api.yearlyGoals.getAchievements,
    userId && !isMonth ? { userId, year } : "skip") || [];
  const monthAchievements = useOfflineQuery<any[]>('monthlyAchievements_detail', api.yearlyGoals.getMonthAchievements,
    userId && isMonth && !isDay ? { userId, year, month: month! } : "skip") || [];
  const dayAchievements = useOfflineQuery<any[]>('dailyAchievements_detail', api.yearlyGoals.getDayAchievements,
    userId && isDay ? { userId, year, month: month!, day: day! } : "skip") || [];

  const achievements = isDay ? dayAchievements : isMonth ? monthAchievements : yearAchievements;

  // Merge into unified list with type tag
  const allItems = [
    ...goals.map((g: any) => ({ ...g, _type: 'goal' as const })),
    ...achievements.map((a: any) => ({ ...a, _type: 'achievement' as const })),
  ].sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

  // Mutations
  const addGoalMut = useOfflineMutation(
    isDay ? api.yearlyGoals.addDayGoal : isMonth ? api.yearlyGoals.addMonthGoal : api.yearlyGoals.addGoal,
    "yearlyGoals:addGoal"
  );
  const addAchievementMut = useOfflineMutation(
    isDay ? api.yearlyGoals.addDayAchievement : isMonth ? api.yearlyGoals.addMonthAchievement : api.yearlyGoals.addAchievement,
    "yearlyGoals:addAchievement"
  );
  const updateGoal = useOfflineMutation(api.yearlyGoals.updateGoal, "yearlyGoals:updateGoal");
  const deleteGoal = useOfflineMutation(api.yearlyGoals.deleteGoal, "yearlyGoals:deleteGoal");
  const updateAchievementMut = useOfflineMutation(api.yearlyGoals.updateAchievement, "yearlyGoals:updateAchievement");
  const deleteAchievementMut = useOfflineMutation(api.yearlyGoals.deleteAchievement, "yearlyGoals:deleteAchievement");

  const [newText, setNewText] = useState('');
  const [addType, setAddType] = useState<'goal' | 'achievement'>('goal');

  const handleAdd = () => {
    if (!newText.trim() || !userId) return;
    const args: any = { userId, year, text: newText.trim() };
    if (isMonth) args.month = month;
    if (isDay) { args.month = month; args.day = day; }
    if (addType === 'goal') addGoalMut(args);
    else addAchievementMut(args);
    setNewText('');
  };

  const handleToggle = (item: any) => {
    if (item._type === 'goal') {
      updateGoal({ id: item._id, isCompleted: !item.isCompleted });
    } else {
      updateAchievementMut({ id: item._id, isCompleted: !item.isCompleted });
    }
  };

  const handleDelete = (item: any) => {
    const label = item._type === 'goal'
      ? (isArabic ? 'هدف' : 'goal')
      : (isArabic ? 'إنجاز' : 'achievement');
    Alert.alert(
      isArabic ? 'تأكيد الحذف' : 'Confirm Delete',
      isArabic ? `هل أنت متأكد من حذف هذا ${label}؟` : `Are you sure you want to delete this ${label}?`,
      [
        { text: isArabic ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isArabic ? 'حذف' : 'Delete', style: 'destructive',
          onPress: () => item._type === 'goal'
            ? deleteGoal({ id: item._id })
            : deleteAchievementMut({ id: item._id }),
        },
      ]
    );
  };

  const totalCount = allItems.length;
  const completedCount = allItems.filter((i: any) => i.isCompleted).length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <AnimatedWavyHeader backgroundColor={colors.bg} waveHeight={10} contentStyle={{ paddingBottom: 2 }}>
          <View style={{
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 10,
            paddingBottom: 8,
          }}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={isArabic ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{pageTitle}</Text>
            <View style={{ width: 24 }} />
          </View>
        </AnimatedWavyHeader>

        {/* Progress Card */}
        {totalCount > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textMuted }}>
                    {isArabic ? 'التقدم' : 'Progress'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="flag" size={12} color={colors.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{goals.length}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="trophy" size={12} color={colors.success} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>{achievements.length}</Text>
                    </View>
                  </View>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>
                  {completedCount}/{totalCount} ({Math.round(progress * 100)}%)
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: colors.border + '40', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: colors.primary, borderRadius: 3 }} />
              </View>
            </View>
          </View>
        )}

        {/* Add Type Toggle */}
        <View style={{
          flexDirection: 'row',
          marginHorizontal: 24,
          marginBottom: 16,
          backgroundColor: colors.border + '40',
          borderRadius: 16,
          padding: 4,
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: addType === 'goal' ? colors.surface : 'transparent',
              alignItems: 'center',
              shadowColor: addType === 'goal' ? colors.shadow : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: addType === 'goal' ? 2 : 0,
            }}
            onPress={() => setAddType('goal')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="flag-outline" size={16} color={addType === 'goal' ? colors.primary : colors.textMuted} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: addType === 'goal' ? colors.text : colors.textMuted }}>
                {isArabic ? 'هدف' : 'Goal'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 14,
              backgroundColor: addType === 'achievement' ? colors.surface : 'transparent',
              alignItems: 'center',
            }}
            onPress={() => setAddType('achievement')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trophy-outline" size={16} color={addType === 'achievement' ? colors.success : colors.textMuted} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: addType === 'achievement' ? colors.text : colors.textMuted }}>
                {isArabic ? 'إنجاز' : 'Achievement'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {totalCount === 0 && (
            <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 14, fontWeight: '500', marginTop: 20 }}>
              {isArabic ? 'لا توجد عناصر بعد. أضف هدفاً أو إنجازاً!' : 'Nothing yet. Add a goal or achievement!'}
            </Text>
          )}

          {allItems.map((item: any) => (
            <View
              key={`${item._type}_${item._id}`}
              style={{
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: item.isCompleted ? colors.success + '30' : colors.border,
                gap: 12,
              }}
            >
              <TouchableOpacity
                onPress={() => handleToggle(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={item.isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={item.isCompleted ? colors.success : colors.border}
                />
              </TouchableOpacity>

              {/* Type badge */}
              <View style={{
                backgroundColor: item._type === 'goal' ? colors.primary + '15' : colors.success + '20',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}>
                <Ionicons
                  name={item._type === 'goal' ? 'flag' : 'trophy'}
                  size={12}
                  color={item._type === 'goal' ? colors.primary : colors.success}
                />
              </View>

              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: '600',
                  color: item.isCompleted ? colors.textMuted : colors.text,
                  textDecorationLine: item.isCompleted ? 'line-through' : 'none',
                  opacity: item.isCompleted ? 0.6 : 1,
                }}
              >
                {item.text}
              </Text>

              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Input */}
          <View style={{
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginTop: 16,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 10,
          }}>
            <TextInput
              style={{
                flex: 1,
                fontSize: 15,
                color: colors.text,
                fontWeight: '500',
                padding: 8,
                textAlign: isArabic ? 'right' : 'left',
              }}
              placeholder={addType === 'goal'
                ? (isArabic ? 'أضف هدفاً...' : 'Add a goal...')
                : (isArabic ? 'أضف إنجازاً...' : 'Add an achievement...')}
              placeholderTextColor={colors.textMuted}
              value={newText}
              onChangeText={setNewText}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleAdd}
              style={{
                backgroundColor: addType === 'goal' ? colors.primary : colors.success,
                width: 36,
                height: 36,
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="add" size={20} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
