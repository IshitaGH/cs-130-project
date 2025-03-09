import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  showCount?: boolean; // Whether to show the count or just a dot
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, showCount = false }) => {
  if (count === 0) {
    return null;
  }
  
  return (
    <View style={styles.badge}>
      {showCount ? (
        <Text style={styles.badgeText}>
          {count > 99 ? '99+' : count}
        </Text>
      ) : (
        <View style={styles.dot} />
      )}
    </View>
  );
};
