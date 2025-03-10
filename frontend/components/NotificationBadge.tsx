import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  showCount?: boolean; // Whether to show the count or just a dot
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  showCount = false,
}) => {
  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.badge}>
      {showCount ? (
        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
      ) : (
        <View style={styles.dot} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#2196F3', // Blue color
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3', // Blue color
  },
});
