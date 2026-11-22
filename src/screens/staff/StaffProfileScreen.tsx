import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Bell,
  LogOut,
  Building,
  BadgeInfo,
  Settings,
  ChevronRight,
} from 'lucide-react-native';
import { DesignationBadge } from '../../components/staff/DesignationBadge';
import { useAuth } from '../../context/AuthContext';
import {
  getDesignationLabel,
  getHumanReadablePermissions,
  normalizeStaffDesignation,
} from '../../components/staff/staffPermissions';

export const StaffProfileScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const designation = user?.designation;
  const canonical = normalizeStaffDesignation(designation);
  const permissions = getHumanReadablePermissions(designation);

  const [pushAlerts, setPushAlerts] = useState(true);
  const [shiftReminders, setShiftReminders] = useState(true);

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      try {
        await logout();
      } catch (err) {
        console.warn('Logout failed:', err);
      }
      return;
    }

    Alert.alert(
      'Sign Out',
      'Sign out of the Star Hospital Staff Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              console.warn('Logout failed:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Profile</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation?.navigate?.('StaffSettings')}
        >
          <Settings size={20} color="#0866C6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity Hero */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>
            {user?.name || getDesignationLabel(designation)}
          </Text>
          <View style={{ marginVertical: 6 }}>
            <DesignationBadge
              designation={
                canonical === 'billing'
                  ? 'billing_clerk'
                  : canonical === 'laboratorist'
                    ? 'lab_tech'
                    : canonical || 'nurse'
              }
              size="md"
            />
          </View>
          <Text style={styles.empMeta}>
            ID: {user?.id?.toUpperCase() || 'STAFF-001'} | Active Shift
          </Text>
        </View>

        {/* Shortcuts */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Navigation</Text>
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation?.navigate?.('StaffNotifications')}
          >
            <Bell size={17} color="#0866C6" />
            <Text style={styles.navText}>Staff Notifications</Text>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation?.navigate?.('StaffSettings')}
          >
            <Settings size={17} color="#0866C6" />
            <Text style={styles.navText}>Terminal Settings &amp; Security</Text>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Contact & Shift */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Employment Details</Text>
          <View style={styles.infoRow}>
            <Building size={15} color="#0866C6" />
            <Text style={styles.infoText}>
              Role: {getDesignationLabel(designation)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={15} color="#0866C6" />
            <Text style={styles.infoText}>
              Shift: Morning (08:00 AM - 04:00 PM)
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={15} color="#0866C6" />
            <Text style={styles.infoText}>
              {user?.phone || '+92 300 1112233'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Mail size={15} color="#0866C6" />
            <Text style={styles.infoText}>
              {user?.email || 'staff@starhospital.com'}
            </Text>
          </View>
        </View>

        {/* Enforced Designation Permissions */}
        <View style={styles.card}>
          <View style={styles.permHeader}>
            <ShieldCheck size={17} color="#16A34A" />
            <Text style={styles.sectionTitle}>
              Authorized Designation Permissions
            </Text>
          </View>
          {permissions.map((perm, idx) => (
            <View key={idx} style={styles.permItem}>
              <BadgeInfo size={14} color="#0866C6" />
              <Text style={styles.permText}>{perm}</Text>
            </View>
          ))}
        </View>

        {/* Alerts */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Shift Task Alerts</Text>
              <Text style={styles.toggleSub}>Receive pending queue pings</Text>
            </View>
            <Switch
              value={pushAlerts}
              onValueChange={setPushAlerts}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={pushAlerts ? '#0866C6' : '#64748B'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Handover Reminders</Text>
              <Text style={styles.toggleSub}>15 min before shift ends</Text>
            </View>
            <Switch
              value={shiftReminders}
              onValueChange={setShiftReminders}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={shiftReminders ? '#0866C6' : '#64748B'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0866C6',
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    color: '#142D4E',
  },
  empMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  navText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#142D4E',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  permHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  permText: {
    fontSize: 12,
    color: '#142D4E',
    fontWeight: '600',
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default StaffProfileScreen;
