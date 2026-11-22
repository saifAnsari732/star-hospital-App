import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Ticket,
  FlaskConical,
  Fingerprint,
  Globe,
  Lock,
  ShieldCheck,
  Trash2,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { useAuth } from '../../context/AuthContext';
import { StarHeader, StarCard } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'Settings'>;

const SETTINGS_STORAGE_KEY = '@star_hospital_patient_settings_v1';
const LANGUAGE_STORAGE_KEY = '@star_hospital_language';
const LANGUAGES = ['English', 'Urdu', 'Hindi'];
const LANG_CODE_TO_NAME: Record<string, string> = {
  en: 'English',
  ur: 'Urdu',
  hi: 'Hindi',
};
const LANG_NAME_TO_CODE: Record<string, string> = {
  English: 'en',
  Urdu: 'ur',
  Hindi: 'hi',
};

interface StoredSettings {
  pushEnabled: boolean;
  opdAlerts: boolean;
  labAlerts: boolean;
  biometricLock: boolean;
  language: string;
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAuth();
  const [settings, setSettings] = useState<StoredSettings>({
    pushEnabled: true,
    opdAlerts: true,
    labAlerts: true,
    biometricLock: false,
    language: 'English',
  });

  useEffect(() => {
    (async () => {
      try {
        const [raw, sharedLangCode] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_STORAGE_KEY),
          AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
        ]);
        const parsed = raw ? JSON.parse(raw) : {};
        const resolvedLang =
          (sharedLangCode && LANG_CODE_TO_NAME[sharedLangCode]) ||
          parsed.language ||
          'English';
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          language: resolvedLang,
        }));
      } catch {
        // Default settings active
      }
    })();
  }, []);

  const updateSetting = async <K extends keyof StoredSettings>(
    key: K,
    val: StoredSettings[K]
  ) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      if (key === 'language' && typeof val === 'string' && LANG_NAME_TO_CODE[val]) {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, LANG_NAME_TO_CODE[val]);
      }
    } catch {
      // Safe fallback
    }
  };

  const handleCycleLanguage = () => {
    const idx = LANGUAGES.indexOf(settings.language);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    updateSetting('language', next);
    Alert.alert(
      'Display Language',
      `Language preference set to ${next}. Full localization resources apply where translated strings are enabled.`
    );
  };

  const handleClearCache = async () => {
    try {
      await AsyncStorage.multiRemove([SETTINGS_STORAGE_KEY, LANGUAGE_STORAGE_KEY]);
      setSettings({
        pushEnabled: true,
        opdAlerts: true,
        labAlerts: true,
        biometricLock: false,
        language: 'English',
      });
      Alert.alert('Preferences Reset', 'Local app settings restored to defaults.');
    } catch {
      Alert.alert('Notice', 'Unable to clear cached preferences right now.');
    }
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
      'Sign out of your Star Hospital patient session?',
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
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader title="Settings" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.groupHeading}>Notifications & Alerts</Text>
        <StarCard style={styles.card} variant="elevated">
          <View style={styles.rowItem}>
            <View style={styles.rowIcon}>
              <Bell size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSub}>Appointment & hospital announcements</Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={(v) => updateSetting('pushEnabled', v)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.pushEnabled ? colors.primary : '#CBD5E1'}
            />
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowIcon}>
              <Ticket size={18} color={colors.tealAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>OPD Live Queue Alerts</Text>
              <Text style={styles.rowSub}>Notify when 2 tokens remain ahead</Text>
            </View>
            <Switch
              value={settings.opdAlerts}
              onValueChange={(v) => updateSetting('opdAlerts', v)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.opdAlerts ? colors.primary : '#CBD5E1'}
            />
          </View>

          <View style={[styles.rowItem, { borderBottomWidth: 0 }]}>
            <View style={styles.rowIcon}>
              <FlaskConical size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Diagnostic Report Alerts</Text>
              <Text style={styles.rowSub}>Alert when verified PDFs are ready</Text>
            </View>
            <Switch
              value={settings.labAlerts}
              onValueChange={(v) => updateSetting('labAlerts', v)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.labAlerts ? colors.primary : '#CBD5E1'}
            />
          </View>
        </StarCard>

        <Text style={styles.groupHeading}>Security & Preferences</Text>
        <StarCard style={styles.card} variant="elevated">
          <View style={styles.rowItem}>
            <View style={styles.rowIcon}>
              <Fingerprint size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>App Quick Lock Preference</Text>
              <Text style={styles.rowSub}>Prompt security verification on open</Text>
            </View>
            <Switch
              value={settings.biometricLock}
              onValueChange={(v) => updateSetting('biometricLock', v)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.biometricLock ? colors.primary : '#CBD5E1'}
            />
          </View>

          <TouchableOpacity
            onPress={handleCycleLanguage}
            style={styles.rowItem}
            activeOpacity={0.75}
          >
            <View style={styles.rowIcon}>
              <Globe size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Language</Text>
              <Text style={styles.rowSub}>Tap to switch ({settings.language})</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ChangePassword')}
            style={[styles.rowItem, { borderBottomWidth: 0 }]}
            activeOpacity={0.75}
          >
            <View style={styles.rowIcon}>
              <Lock size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Change Password</Text>
              <Text style={styles.rowSub}>Update account login credentials</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </StarCard>

        <Text style={styles.groupHeading}>Account & Privacy</Text>
        <StarCard style={styles.card} variant="elevated">
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Patient Privacy & HIPAA Compliance',
                'Star Hospital encrypts patient electronic health records and diagnostic reports in transit and restricts access by verified patient/clinician roles.'
              )
            }
            style={styles.rowItem}
            activeOpacity={0.75}
          >
            <View style={styles.rowIcon}>
              <ShieldCheck size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Privacy & Clinical Data Notice</Text>
              <Text style={styles.rowSub}>How Star Hospital protects your health data</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearCache}
            style={styles.rowItem}
            activeOpacity={0.75}
          >
            <View style={styles.rowIcon}>
              <Trash2 size={18} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Reset Local Preferences</Text>
              <Text style={styles.rowSub}>Restore notification & display defaults</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.rowItem, { borderBottomWidth: 0 }]}
            activeOpacity={0.75}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.dangerLight }]}>
              <LogOut size={18} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.danger }]}>Sign Out</Text>
              <Text style={styles.rowSub}>End current Star Hospital session</Text>
            </View>
            <ChevronRight size={18} color={colors.danger} />
          </TouchableOpacity>
        </StarCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  groupHeading: {
    ...typography.labelLarge,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.xl },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { ...typography.labelLarge, color: colors.textPrimary },
  rowSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
