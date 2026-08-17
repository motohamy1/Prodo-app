import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';

interface RoadmapViewProps {
  suggestions: any[];
  style?: any;
}

export const RoadmapView = ({ suggestions, style }: RoadmapViewProps) => {
  const { colors } = useTheme();
  
  if (!suggestions?.length) return null;
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      default: return colors.info;
    }
  };
  
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'HIGH';
      case 'medium': return 'MED';
      default: return 'LOW';
    }
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={20} color={colors.primary} />
          <Text style={styles.title}>🗺️ Your Roadmap</Text>
        </View>
        <Text style={styles.subtitle}>{suggestions.length} smart suggestions</Text>
      </View>
      
      <FlatList
        data={suggestions}
        keyExtractor={(item, index) => `${item.topicId}-${index}`}
        renderItem={({ item, index }) => {
          const priorityColor = getPriorityColor(item.priority);
          const priorityLabel = getPriorityLabel(item.priority);
          return (
            <TouchableOpacity style={styles.suggestionRow} activeOpacity={0.7}>
              <View style={styles.numberCircle}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <View style={styles.suggestionContent}>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
                    <Text style={[styles.priorityText, { color: priorityColor }]}>{priorityLabel}</Text>
                  </View>
                </View>
                <Text style={styles.suggestionReason}>{item.reason}</Text>
                <View style={styles.actionRow}>
                  <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                  <Text style={styles.suggestionAction}>{item.suggestedAction}</Text>
                </View>
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
  suggestionRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  suggestionReason: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionAction: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
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

export default RoadmapView;