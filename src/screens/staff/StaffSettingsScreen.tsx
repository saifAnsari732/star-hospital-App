import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  RefreshCw,
  ShieldCheck,
  LogOut,
  CheckCircle2,
} from 'lucide-react-native';
import { StarHeader } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { getDesignationLabel } from '../../components/staff/staffPermissions';

export const StaffSettingsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const [shiftAlerts, setShiftAlerts] = useState(true);
  const [autoRefreshWorklist, setAutoRefreshWorklist] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    Alert.alert(
      'Settings Saved',
      'Staff terminal preferences updated successfully.'
    );
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      try {
        await logout();
      } catch (err) {
        console.warn('Logout failed:', err);
      }
      return;
    }

    Alert.alert('Sign Out', 'Sign out of the Star Hospital Staff Portal?', [
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
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Staff Settings"
        subtitle={getDesignationLabel(user?.designation)}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {savedNotice ? (
          <View style={styles.savedBanner}>
            <CheckCircle2 size={16} color="#16A34A" />
            <Text style={styles.savedText}>
              Preferences saved for your shift session.
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Terminal &amp; Alerts</Text>
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Bell size={18} color="#0866C6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Shift &amp; Task Alerts</Text>
                <Text style={styles.rowSub}>
                  Notify when new tasks arrive for your role
                </Text>
              </View>
            </View>
            <Switch
              value={shiftAlerts}
              onValueChange={setShiftAlerts}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={shiftAlerts ? '#0866C6' : '#64748B'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <RefreshCw size={18} color="#0866C6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Auto-Refresh Worklists</Text>
                <Text style={styles.rowSub}>
                  Keep OPD queue &amp; department worklists live
                </Text>
              </View>
            </View>
            <Switch
              value={autoRefreshWorklist}
              onValueChange={setAutoRefreshWorklist}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={autoRefreshWorklist ? '#0866C6' : '#64748B'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Bell size={18} color="#16A34A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Alert Sound Cue</Text>
                <Text style={styles.rowSub}>
                  Audible ping on urgent requests
                </Text>
              </View>
            </View>
            <Switch
              value={soundNotifications}
              onValueChange={setSoundNotifications}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={soundNotifications ? '#16A34A' : '#64748B'}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Role Security</Text>
        <View style={styles.card}>
          <View style={styles.rowLeft}>
            <ShieldCheck size={18} color="#0866C6" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                Active RBAC Role: {getDesignationLabel(user?.designation)}
              </Text>
              <Text style={styles.rowSub}>
                Permissions and screens are strictly enforced by hospital IT policy.
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  savedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  rowSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  saveBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default StaffSettingsScreen;
