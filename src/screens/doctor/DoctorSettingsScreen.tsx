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
  Clock,
  FileSignature,
  Video,
  ShieldCheck,
  Volume2,
  LogOut,
  CheckCircle2,
} from 'lucide-react-native';
import { StarHeader } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

export const DoctorSettingsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const [tokenAudioChime, setTokenAudioChime] = useState(true);
  const [criticalLabAlerts, setCriticalLabAlerts] = useState(true);
  const [videoConsultEnabled, setVideoConsultEnabled] = useState(true);
  const [digitalSignatureAutoAttach, setDigitalSignatureAutoAttach] =
    useState(true);
  const [defaultConsultMinutes, setDefaultConsultMinutes] = useState<number>(15);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSavePreferences = () => {
    setSavedNotice(true);
    Alert.alert(
      'Settings Updated',
      'Your consultation preferences and notification settings have been saved.'
    );
  };

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
      'Sign out of the Star Hospital Doctor Portal?',
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
      <StarHeader
        title="Doctor Settings"
        subtitle={user?.name || 'Attending Physician'}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {savedNotice ? (
          <View style={styles.savedBanner}>
            <CheckCircle2 size={16} color="#16A34A" />
            <Text style={styles.savedText}>Preferences saved for active chamber session.</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>OPD & Consultation Defaults</Text>
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Volume2 size={18} color="#0866C6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Token Calling Audio Chime</Text>
                <Text style={styles.rowSub}>
                  Announce patient token on Call Next action
                </Text>
              </View>
            </View>
            <Switch
              value={tokenAudioChime}
              onValueChange={setTokenAudioChime}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={tokenAudioChime ? '#0866C6' : '#64748B'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Video size={18} color="#0866C6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Accept Video Consultations</Text>
                <Text style={styles.rowSub}>
                  Allow tele-OPD bookings in your schedule
                </Text>
              </View>
            </View>
            <Switch
              value={videoConsultEnabled}
              onValueChange={setVideoConsultEnabled}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={videoConsultEnabled ? '#0866C6' : '#64748B'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.durationBlock}>
            <View style={styles.rowLeft}>
              <Clock size={18} color="#0866C6" />
              <Text style={styles.rowTitle}>Default Slot Duration (mins)</Text>
            </View>
            <View style={styles.durationPills}>
              {[10, 15, 20, 30].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.pill,
                    defaultConsultMinutes === m && styles.pillActive,
                  ]}
                  onPress={() => setDefaultConsultMinutes(m)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      defaultConsultMinutes === m && styles.pillTextActive,
                    ]}
                  >
                    {m}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Alerts & Digital Rx</Text>
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Bell size={18} color="#D97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Critical Lab Result Alerts</Text>
                <Text style={styles.rowSub}>
                  Immediate push alerts when flagged results arrive
                </Text>
              </View>
            </View>
            <Switch
              value={criticalLabAlerts}
              onValueChange={setCriticalLabAlerts}
              trackColor={{ false: '#CBD5E1', true: '#FCD34D' }}
              thumbColor={criticalLabAlerts ? '#D97706' : '#64748B'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <FileSignature size={18} color="#16A34A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Attach Verified e-Rx Signature</Text>
                <Text style={styles.rowSub}>
                  Include medical registration badge & QR on issued Rx
                </Text>
              </View>
            </View>
            <Switch
              value={digitalSignatureAutoAttach}
              onValueChange={setDigitalSignatureAutoAttach}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={digitalSignatureAutoAttach ? '#16A34A' : '#64748B'}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account Security</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() =>
              Alert.alert(
                'Password Security',
                'Password rotation is managed through Star Hospital IT Identity Desk.'
              )
            }
          >
            <ShieldCheck size={18} color="#0866C6" />
            <Text style={styles.actionText}>Change Account Password</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.85}
          onPress={handleSavePreferences}
        >
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Sign Out of Doctor Portal</Text>
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
    paddingBottom: 40,
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
    marginBottom: 14,
  },
  savedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 4,
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
  durationBlock: {
    gap: 10,
    paddingVertical: 4,
  },
  durationPills: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
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
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default DoctorSettingsScreen;
