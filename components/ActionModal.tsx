import useTheme, { getNeoShadow } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export interface ActionOption {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'default' | 'destructive';
}

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  options: ActionOption[];
  title?: string;
  isArabic?: boolean;
}

const ActionModal: React.FC<ActionModalProps> = ({ visible, onClose, options, title, isArabic = false }) => {
  const { colors, isDarkMode } = useTheme();
  const raised = getNeoShadow(colors, 'raised', isArabic);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[
              styles.content, 
              { 
                backgroundColor: colors.neomorphic.raised.backgroundColor, 
                borderTopLeftRadius: 32, 
                borderTopRightRadius: 32,
                shadowColor: colors.shadow,
                shadowOffset: { width: -8, height: -8 },
                shadowOpacity: 0.1,
                shadowRadius: 16,
                elevation: 8,
              }
            ]}>
              <View style={styles.handle} />
              
              {title && (
                <View style={[styles.header]}>
                  <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close-circle" size={28} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.optionsContainer}>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.option,
                      { 
                        backgroundColor: colors.neomorphic.raised.backgroundColor,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 4, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 4,
                      },
                      index === 0 && { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
                      index === options.length - 1 && { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
                      index < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                    ]}
                    onPress={() => {
                      option.onPress();
                      onClose();
                    }}
                  >
                    <View style={[
                      styles.iconWrap, 
                      { 
                        backgroundColor: colors.neomorphic.raised.backgroundColor,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 2, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }
                    ]}>
                      <Ionicons 
                        name={option.icon} 
                        size={22} 
                        color={option.variant === 'destructive' ? colors.danger : colors.primary} 
                      />
                    </View>
                    <Text style={[
                      styles.optionLabel, 
                      { color: option.variant === 'destructive' ? colors.danger : colors.text },
                      isArabic && { textAlign: 'right' },
                      { marginHorizontal: 16 }
                    ]}>
                      {option.label}
                    </Text>
                    <Ionicons 
                      name={isArabic ? "chevron-back" : "chevron-forward"} 
                      size={18} 
                      color={colors.textMuted} 
                      style={{ opacity: 0.5 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]} 
                onPress={onClose}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>{isArabic ? 'إلغاء' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(150,150,150,0.25)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  optionsContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  cancelButton: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '800',
  },
});

export default ActionModal;
