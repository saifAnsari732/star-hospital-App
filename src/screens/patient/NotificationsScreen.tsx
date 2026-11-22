import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  CalendarCheck,
  FileCheck,
  Pill,
  Bell,
  Check,
} from 'lucide-react-native';
import { notificationService } from '../../services';
import { NotificationItem } from '../../types/notification';

export interface NotificationsScreenProps {
  navigation: any;
  route?: any;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'opd_token',
    title: 'Your OPD Token A-102 is generated.',
    body: 'Estimated waiting time is ~15 mins. Please check live queue status.',
    read: false,
    createdAt: '2 min ago',
    dataPayload: { route: 'OPDToken' },
  },
  {
    id: 'notif-2',
    category: 'appointment',
    title: 'Appointment Confirmed with Dr. Amit Sharma',
    body: 'Today at 10:30 AM',
    read: false,
    createdAt: '5 min ago',
    dataPayload: { route: 'AppointmentsTab' },
  },
  {
    id: 'notif-3',
    category: 'lab_report',
    title: 'Lab Report is Ready',
    body: 'Download Now',
    read: true,
    createdAt: '10 Oct 2026',
    dataPayload: { route: 'ReportsTab' },
  },
  {
    id: 'notif-4',
    category: 'prescription',
    title: 'New Prescription Issued',
    body: 'Dr. Amit Sharma has issued your medical prescription RX-2026-0042.',
    read: true,
    createdAt: '15 Nov 2026',
    dataPayload: { route: 'PrescriptionsList' },
  },
];

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      notificationService
        .getNotifications()
        .then((items) => {
          if (active && items.length > 0) {
            setNotifications(items);
          }
        })
        .catch(() => {
          // Keep initial fallback feed
        });
      return () => {
        active = false;
      };
    }, [])
  );

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch {
      // UI remains optimistically marked
    }
  };

  const handleItemPress = async (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    try {
      await notificationService.markAsRead(item.id);
    } catch {
      // Non-fatal
    }

    if (item.dataPayload?.route) {
      navigation.navigate(item.dataPayload.route);
    }
  };

  const getCategoryIcon = (category: NotificationItem['category']) => {
    switch (category) {
      case 'opd_token':
        return {
          bg: '#FEF3C7',
          color: '#D97706',
          icon: <Bell size={20} color="#D97706" />,
        };
      case 'appointment':
        return {
          bg: '#DCFCE7',
          color: '#16A34A',
          icon: <CalendarCheck size={20} color="#16A34A" />,
        };
      case 'lab_report':
        return {
          bg: '#DCFCE7',
          color: '#16A34A',
          icon: <FileCheck size={20} color="#16A34A" />,
        };
      case 'prescription':
      default:
        return {
          bg: '#E0F2FE',
          color: '#0866C6',
          icon: <Pill size={20} color="#0866C6" />,
        };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <ChevronLeft size={24} color="#142D4E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.markReadBtn}
          onPress={handleMarkAllRead}
          accessibilityRole="button"
          accessibilityLabel="Mark all as read"
        >
          <Check size={16} color="#0866C6" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={36} color="#0866C6" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>You are completely caught up!</Text>
          </View>
        ) : (
          notifications.map((item) => {
            const config = getCategoryIcon(item.category);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.notificationCard, !item.read && styles.notificationCardUnread]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.createdAt}`}
              >
                <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
                  {config.icon}
                </View>

                <View style={styles.contentCol}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                  </View>

                  <Text style={styles.notifBody}>{item.body}</Text>

                  <View style={styles.footerRow}>
                    <Text style={styles.timestampText}>{item.createdAt}</Text>
                    {item.category === 'lab_report' ? (
                      <Text style={styles.actionLinkText}>Download Now &gt;</Text>
                    ) : item.category === 'opd_token' ? (
                      <Text style={styles.actionLinkText}>View Status &gt;</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142D4E',
  },
  markReadBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EBF4FF',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    paddingBottom: 30,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationCardUnread: {
    borderColor: '#BFDBFE',
    backgroundColor: '#FAFCFF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#142D4E',
    flex: 1,
    lineHeight: 18,
  },
  notifTitleUnread: {
    fontWeight: '700',
    color: '#064A91',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0866C6',
    marginLeft: 6,
    marginTop: 4,
  },
  notifBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestampText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0866C6',
  },
});

export default NotificationsScreen;
