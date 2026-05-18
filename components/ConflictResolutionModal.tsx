import useTheme from '@/hooks/useTheme';
import { Conflict, ConflictResolution } from '@/utils/conflictResolution';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface ConflictResolutionModalProps {
  visible: boolean;
  conflicts: Conflict<any>[];
  onResolve: (resolutions: ConflictResolution[]) => void;
  onClose: () => void;
  isArabic?: boolean;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  visible,
  conflicts,
  onResolve,
  onClose,
  isArabic = false
}) => {
  const { colors } = useTheme();
  const [resolutions, setResolutions] = useState<Record<string, 'local' | 'remote' | 'merge'>>({});
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);

  const currentConflict = conflicts[currentConflictIndex];

  const handleResolutionChoice = (choice: 'local' | 'remote' | 'merge') => {
    setResolutions(prev => ({
      ...prev,
      [currentConflict.id]: choice
    }));
  };

  const handleNext = () => {
    if (currentConflictIndex < conflicts.length - 1) {
      setCurrentConflictIndex(prev => prev + 1);
    } else {
      handleResolveAll();
    }
  };

  const handlePrevious = () => {
    if (currentConflictIndex > 0) {
      setCurrentConflictIndex(prev => prev - 1);
    }
  };

  const handleResolveAll = () => {
    const finalResolutions: ConflictResolution[] = conflicts.map(conflict => ({
      conflictId: conflict.id,
      resolution: resolutions[conflict.id] || 'local' // Default to local
    }));

    onResolve(finalResolutions);
    setResolutions({});
    setCurrentConflictIndex(0);
  };

  const getConflictSummary = (conflict: Conflict<any>) => {
    const title = conflict.type === 'todo' 
      ? (conflict.localVersion?.text || conflict.remoteVersion?.text || 'Untitled Task')
      : (conflict.localVersion?.name || conflict.remoteVersion?.name || 'Untitled Project');

    const description = conflict.conflictType === 'update'
      ? 'This item has been modified on both devices'
      : conflict.conflictType === 'create'
      ? 'This item exists locally but not remotely'
      : 'This item was deleted locally but still exists remotely';

    return { title, description };
  };

  if (!currentConflict) return null;

  const { title, description } = getConflictSummary(currentConflict);
  const currentResolution = resolutions[currentConflict.id] || 'local';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
        <View style={[styles.overlay, { backgroundColor: colors.text + '99' }]}>
        <View style={[styles.content, { backgroundColor: colors.bg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isArabic ? 'حل التعارضات' : 'Resolve Conflicts'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Progress */}
          <View style={styles.progress}>
            <Text style={[styles.progressText, { color: colors.textMuted }]}>
              {isArabic 
                ? `تعارض ${currentConflictIndex + 1} من ${conflicts.length}`
                : `Conflict ${currentConflictIndex + 1} of ${conflicts.length}`
              }
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.primary,
                    width: `${((currentConflictIndex + 1) / conflicts.length) * 100}%`
                  }
                ]} 
              />
            </View>
          </View>

          {/* Conflict Details */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={[styles.conflictCard, { backgroundColor: colors.text + '0D' }]}>
              <Text style={[styles.conflictTitle, { color: colors.text }]}>
                {title}
              </Text>
              <Text style={[styles.conflictDescription, { color: colors.textMuted }]}>
                {description}
              </Text>
            </View>

            {/* Resolution Options */}
            <View style={styles.optionsContainer}>
              <Text style={[styles.optionsTitle, { color: colors.text }]}>
                {isArabic ? 'اختر الحل:' : 'Choose Resolution:'}
              </Text>

              {/* Local Option */}
              <TouchableOpacity
                style={[
                  styles.option,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: currentResolution === 'local' ? colors.primary : colors.border
                  }
                ]}
                onPress={() => handleResolutionChoice('local')}
              >
                <View style={[styles.optionRadio, { borderColor: colors.primary }]}>
                  {currentResolution === 'local' && (
                    <View style={[styles.optionRadioSelected, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {isArabic ? 'استخدام النسخة المحلية' : 'Use Local Version'}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                    {isArabic 
                      ? 'احتفظ بالتغييرات من هذا الجهاز'
                      : 'Keep changes from this device'
                    }
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Remote Option */}
              <TouchableOpacity
                style={[
                  styles.option,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: currentResolution === 'remote' ? colors.primary : colors.border
                  }
                ]}
                onPress={() => handleResolutionChoice('remote')}
              >
                <View style={[styles.optionRadio, { borderColor: colors.primary }]}>
                  {currentResolution === 'remote' && (
                    <View style={[styles.optionRadioSelected, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {isArabic ? 'استخدام النسخة البعيدة' : 'Use Remote Version'}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                    {isArabic 
                      ? 'استخدم التغييرات من الخادم'
                      : 'Use changes from server'
                    }
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Merge Option */}
              <TouchableOpacity
                style={[
                  styles.option,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: currentResolution === 'merge' ? colors.primary : colors.border
                  }
                ]}
                onPress={() => handleResolutionChoice('merge')}
              >
                <View style={[styles.optionRadio, { borderColor: colors.primary }]}>
                  {currentResolution === 'merge' && (
                    <View style={[styles.optionRadioSelected, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {isArabic ? 'دمج' : 'Merge'}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                    {isArabic 
                      ? 'ادمج التغييرات تلقائياً'
                      : 'Automatically merge changes'
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  { 
                    backgroundColor: colors.surface,
                    opacity: currentConflictIndex === 0 ? 0.5 : 1
                  }
                ]}
                onPress={handlePrevious}
                disabled={currentConflictIndex === 0}
              >
                <Ionicons 
                  name={isArabic ? "chevron-forward" : "chevron-back"} 
                  size={20} 
                  color={colors.text} 
                />
                <Text style={[styles.navButtonText, { color: colors.text }]}>
                  {isArabic ? 'التالي' : 'Previous'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navButton,
                  styles.nextButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleNext}
              >
                <Text style={[styles.nextButtonText, { color: colors.primaryText }]}>
                  {currentConflictIndex === conflicts.length - 1 
                    ? (isArabic ? 'حل الكل' : 'Resolve All')
                    : (isArabic ? 'التالي' : 'Next')
                  }
                </Text>
                <Ionicons 
                  name={isArabic ? "chevron-back" : "chevron-forward"} 
                  size={20} 
                  color={colors.primaryText} 
                />
              </TouchableOpacity>
            </View>
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
  },
  content: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  progress: {
    padding: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  conflictCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  conflictDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    minWidth: 100,
  },
  nextButton: {
    minWidth: 120,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConflictResolutionModal;
