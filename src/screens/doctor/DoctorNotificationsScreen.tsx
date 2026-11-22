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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Calendar,
  FlaskConical,
  Users,
  CheckCheck,
  AlertCircle,
} from 'lucide-react-native';
import { StarHeader, StarLoader, EmptyState } from '../../components/common';
import { notificationService } from '../../services/notificationService';
import type { NotificationCategory, NotificationItem } from '../../types/notification';

const FILTER_OPTIONS: Array<{ key: 'all' | NotificationCategory; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'opd_token', label: 'OPD Queue' },
  { key: 'lab_report', label: 'Lab Alerts' },
  { key: 'appointment', label: 'Appointments' },
];

export const DoctorNotificationsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | NotificationCategory>('all');

  const fetchNotifications = useCallback(async () => {
    setError(null);
    try {
      const items = await notificationService.getNotifications();
      setNotifications(items);
    } catch {
      setError('Unable to load clinical notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.category === filter);
  }, [notifications, filter]);

  const handleMarkRead = async (item: NotificationItem) => {
    try {
      await notificationService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
    } catch {}
    if (item.category === 'opd_token') {
      navigation.navigate('OPDQueueCaller');
    } else if (item.category === 'appointment') {
      navigation.navigate('DoctorTabs', { screen: 'ScheduleTab' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const renderIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'opd_token':
        return <Users size={18} color="#0866C6" />;
      case 'lab_report':
        return <FlaskConical size={18} color="#D97706" />;
      case 'appointment':
        return <Calendar size={18} color="#16A34A" />;
      default:
        return <Bell size={18} color="#0866C6" />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Clinical Notifications"
        subtitle={`${unreadCount} unread`}
        onBackPress={() => navigation.goBack()}
        rightAction={
          unreadCount > 0 ? (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <CheckCheck size={16} color="#0866C6" />
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <StarLoader message="Fetching clinical alerts..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifications();
              }}
              tintColor="#0866C6"
            />
          }
        >
          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {filtered.length === 0 ? (
            <EmptyState
              title="No Notifications"
              description="You are all caught up on OPD queue alerts, lab updates, and appointment notices."
            />
          ) : (
            filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, !item.read && styles.unreadCard]}
                activeOpacity={0.8}
                onPress={() => handleMarkRead(item)}
              >
                <View style={styles.iconWrap}>{renderIcon(item.category)}</View>
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
  markAllBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
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
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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

export default DoctorNotificationsScreen;
