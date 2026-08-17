import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '@/hooks/useTheme';

interface FocusTopicsCardProps {
  insights: any;
  style?: any;
}

export const FocusTopicsCard = ({ insights, style }: FocusTopicsCardProps) => {
  const { colors } = useTheme();
  
  if (!insights?.topTopics?.length) return null;
  
  const getTopicColor = (name: string) => {
    // Generate consistent color from topic name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return { name: 'trending-up', color: colors.success };
      case 'down': return { name: 'trending-down', color: colors.danger };
      default: return { name: 'remove', color: colors.textMuted };
    }
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Focus Topics Today</Text>
        <Text style={styles.subtitle}>{insights.topTopics.length} active areas</Text>
      </View>
      <FlatList
        data={insights.topTopics.slice(0, 5)}
        keyExtractor={item => item.topicId}
        renderItem={({ item }) => {
          const trendIcon = getTrendIcon(item.trend);
          const topicColor = getTopicColor(item.name);
          return (
            <TouchableOpacity style={styles.topicRow} activeOpacity={0.8}>
              <View style={[styles.topicDot, { backgroundColor: topicColor }]} />
              <View style={styles.topicInfo}>
                <Text style={styles.topicName}>{item.name}</Text>
                <Text style={styles.topicMeta}>
                  {item.activityCount} tasks · {Math.round(item.completionRate * 100)}% done · {Math.round(item.timeShare * 100)}% time
                </Text>
              </View>
              <Ionicons name={trendIcon.name as any} size={18} color={trendIcon.color} />
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  topicDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  topicMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 4,
  },
});

export default FocusTopicsCard;