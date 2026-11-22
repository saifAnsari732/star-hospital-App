import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  CheckCheck,
  FlaskConical,
  Receipt,
  Calendar,
  Ticket,
} from 'lucide-react-native';
import { StarHeader, StarLoader, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { canAccessStaffRoute } from '../../components/staff/staffPermissions';
import { notificationService } from '../../services/notificationService';
import type { NotificationCategory, NotificationItem } from '../../types/notification';

export const StaffNotificationsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const designation = user?.designation;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const list = await notificationService.getNotifications();
      // Filter billing notifications strictly to authorized billing/admin roles
      const filteredByRole = list.filter((n) => {
        if (n.category === 'billing') {
          return canAccessStaffRoute(designation, 'BillingInvoice');
        }
        return true;
      });
      setNotifications(filteredByRole);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [designation]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const handleMarkRead = async (item: NotificationItem) => {
    await notificationService.markAsRead(item.id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAll = async () => {
    await notificationService.markAllAsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const renderIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'opd_token':
        return <Ticket size={18} color="#0866C6" />;
      case 'lab_report':
        return <FlaskConical size={18} color="#D97706" />;
      case 'billing':
        return <Receipt size={18} color="#16A34A" />;
      case 'appointment':
        return <Calendar size={18} color="#0284C7" />;
      default:
        return <Bell size={18} color="#0866C6" />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Staff Notifications"
        subtitle={`${unreadCount} unread`}
        onBackPress={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity style={styles.markBtn} onPress={handleMarkAll}>
              <CheckCheck size={16} color="#0866C6" />
            </TouchableOpacity>
          ) : null
        }
      />

      {loading ? (
        <StarLoader message="Loading shift alerts..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotifications();
              }}
              tintColor="#0866C6"
            />
          }
        >
          {notifications.length === 0 ? (
            <EmptyState
              title="No Shift Notifications"
              description="Operational notices for your designation will appear here."
            />
          ) : (
            notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, !item.read && styles.unreadCard]}
                onPress={() => handleMarkRead(item)}
              >
                <View style={styles.iconBox}>{renderIcon(item.category)}</View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.cardBody}>{item.body}</Text>
                  <Text style={styles.cardDate}>
                    {item.createdAt.split('T')[0]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  markBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 34,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  unreadCard: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FBFF',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0866C6',
  },
  cardBody: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
  },
  cardDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '600',
  },
});

export default StaffNotificationsScreen;
