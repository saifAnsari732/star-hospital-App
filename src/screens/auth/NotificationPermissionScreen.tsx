import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthNavigationProp, AuthRouteProp } from '../../navigation/navigationTypes';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services';
import { Bell, Ticket, CalendarCheck, FileCheck, CheckCircle2 } from 'lucide-react-native';

export const NotificationPermissionScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'NotificationPermission'>>();
  const route = useRoute<AuthRouteProp<'NotificationPermission'>>();
  const { registerPatient } = useAuth();
  const registrationData = route.params?.registrationData;
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const completeOnboarding = async () => {
    if (registrationData) {
      await registerPatient(registrationData);
      return;
    }
    navigation.navigate('Login');
  };

  const handleAllowNotifications = async () => {
    setErrorMsg(null);
    setIsRegistering(true);
    try {
      await notificationService.registerPushToken({
        token: `star-hospital-device-${Platform.OS}-${Date.now()}`,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        userId: 'pat-1',
      });
    } catch {
      // Allow onboarding flow to proceed if push registration is deferred
    }
    try {
      await completeOnboarding();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to finalize account registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSkip = async () => {
    setErrorMsg(null);
    setIsRegistering(true);
    try {
      await completeOnboarding();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to finalize account registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Graphic Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.bellOuterCircle}>
            <View style={styles.bellInnerCircle}>
              <Bell size={44} color="#0866C6" strokeWidth={2.2} />
            </View>
          </View>
          <Text style={styles.headline}>Never Miss a Critical Update</Text>
          <Text style={styles.subheadline}>
            Enable real-time push alerts to stay informed during your hospital visit.
          </Text>
        </View>

        {/* 3 Value Points */}
        <View style={styles.benefitsContainer}>
          {/* Item 1 */}
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ticket size={20} color="#D97706" />
            </View>
            <View style={styles.benefitTextGroup}>
              <Text style={styles.benefitTitle}>Live OPD Queue Alerts</Text>
              <Text style={styles.benefitDescription}>
                Get notified when your token is called or your turn is 2 positions away.
              </Text>
            </View>
          </View>

          {/* Item 2 */}
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <CalendarCheck size={20} color="#16A34A" />
            </View>
            <View style={styles.benefitTextGroup}>
              <Text style={styles.benefitTitle}>Appointment Reminders</Text>
              <Text style={styles.benefitDescription}>
                Timely schedule reminders so you never miss a doctor consultation.
              </Text>
            </View>
          </View>

          {/* Item 3 */}
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIconCircle, { backgroundColor: '#CCFBF1' }]}>
              <FileCheck size={20} color="#0D9488" />
            </View>
            <View style={styles.benefitTextGroup}>
              <Text style={styles.benefitTitle}>Diagnostic Reports Ready</Text>
              <Text style={styles.benefitDescription}>
                Instant alerts the moment your lab or radiology test reports are released.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footerSection}>
          {errorMsg ? (
            <Text style={{ color: '#DC2626', textAlign: 'center', marginBottom: 10, fontSize: 13 }}>
              {errorMsg}
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.allowButton}
            onPress={handleAllowNotifications}
            disabled={isRegistering}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Allow notifications"
          >
            {isRegistering ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle2 size={18} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.allowButtonText}>Allow Notifications</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
    paddingTop: 32,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  bellOuterCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  bellInnerCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#142D4E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
  },
  benefitsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  benefitTextGroup: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
  footerSection: {
    width: '100%',
  },
  allowButton: {
    backgroundColor: '#0866C6',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default NotificationPermissionScreen;
