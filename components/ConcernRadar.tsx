import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';

interface ConcernRadarProps {
  insights: any;
  style?: any;
}

export const ConcernRadar = ({ insights, style }: ConcernRadarProps) => {
  const { colors } = useTheme();
  
  if (!insights?.neglectedTopics?.length) return null;
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      default: return colors.info;
    }
  };
  
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'alert-circle-outline';
      case 'medium': return 'warning-outline';
      default: return 'information-circle-outline';
    }
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="radio-outline" size={20} color={colors.warning} />
          <Text style={styles.title}>🎯 Concern Radar</Text>
        </View>
        <Text style={styles.subtitle}>{insights.neglectedTopics.length} areas need attention</Text>
      </View>
      
      <FlatList
        data={insights.neglectedTopics}
        keyExtractor={item => item.topicId}
        renderItem={({ item, index }) => {
          const priorityColor = getPriorityColor(item.priority || 'medium');
          const priorityIcon = getPriorityIcon(item.priority || 'medium');
          return (
            <TouchableOpacity style={styles.concernRow} activeOpacity={0.7}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <View style={styles.concernInfo}>
                <View style={styles.concernHeader}>
                  <Text style={styles.concernName}>{item.name}</Text>
                  <Ionicons name={priorityIcon as any} size={14} color={priorityColor} />
                </View>
                <Text style={styles.concernReason}>{item.reason}</Text>
                <Text style={[styles.concernAction, { color: priorityColor }]}>
                  💡 {item.suggestedAction || 'Schedule time for this area'}
                </Text>
              </View>
              <View style={[styles.daysBadge, { backgroundColor: `${priorityColor}20` }]}>
                <Text style={[styles.daysText, { color: priorityColor }]}>
                  {item.daysSinceActivity}d
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
  },
  concernRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 12,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  concernInfo: {
    flex: 1,
  },
  concernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  concernName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  concernReason: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  concernAction: {
    fontSize: 11,
    fontWeight: '500',
  },
  daysBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  daysText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 12,
  },
});

export default ConcernRadar;