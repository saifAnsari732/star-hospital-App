import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../../navigation/navigationTypes';
import { useAuth } from '../../context/AuthContext';
import { resolveIdentityFromLoginId } from '../../services/authService';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  KeyRound,
} from 'lucide-react-native';
import { TEMPLATE_IMAGES } from '../../assets/images';

const DEMO_ACCOUNTS = [
  {
    id: 'PAT-1001',
    email: 'rahul@gmail.com',
    pass: 'Star@123',
    label: 'Patient (Default Role)',
    sub: 'rahul@gmail.com • Default for all Signups/Logins',
    badgeBg: '#E0F2FE',
    badgeColor: '#0866C6',
  },
  {
    id: 'DOC-2001',
    email: 'dr.amit@starhospital.com',
    pass: 'Star@123',
    label: 'Doctor (Assigned by Admin)',
    sub: 'dr.amit@starhospital.com',
    badgeBg: '#DCFCE7',
    badgeColor: '#16A34A',
  },
  {
    id: 'ADM-3001',
    email: 'admin@starhospital.com',
    pass: 'Star@123',
    label: 'Hospital Admin / Staff (Assigns Roles)',
    sub: 'admin@starhospital.com',
    badgeBg: '#EDE9FE',
    badgeColor: '#7C3AED',
  },
];

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'Login'>>();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const detectedIdentity = identifier.trim()
    ? resolveIdentityFromLoginId(identifier)
    : null;

  const handleLogin = async (overrideLogin?: string, overridePassword?: string) => {
    setErrorMessage(null);
    const activeIdentifier = (overrideLogin ?? identifier).trim();
    const activePassword = overridePassword ?? password;

    if (!activeIdentifier) {
      setErrorMessage('Please enter your Email Address or Role ID (e.g. PAT-1001, DOC-2001, STF-3001).');
      return;
    }

    if (!activePassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const resolved = resolveIdentityFromLoginId(activeIdentifier);
      await login({
        login: activeIdentifier,
        password: activePassword,
        role: resolved.role,
        designation: resolved.designation,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your Email/Role ID and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', {
      role: detectedIdentity?.role || 'patient',
    });
  };

  const handleRegister = () => {
    navigation.navigate('PatientRegistration');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Brand Logo & Title matching Reference UI Image */}
          <View style={styles.brandHeader}>
            <Image
              source={TEMPLATE_IMAGES.starLogo}
              style={{ width: 84, height: 68 }}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>Star Hospital</Text>
            <Text style={styles.brandTagline}>Care Today... Healthier Tomorrow...</Text>
          </View>

          {/* Unified Single-Panel Login Card */}
          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>Login</Text>
            <Text style={styles.loginSubtitle}>
              Unified Portal • Sign in with your Role ID or Email &amp; Password
            </Text>

            {/* Auto-Detected Role Indicator Badge */}
            <View style={styles.identityBanner}>
              <ShieldCheck size={16} color="#0866C6" />
              <Text style={styles.identityBannerText}>
                {detectedIdentity
                  ? `Assigned Role: ${detectedIdentity.role.toUpperCase()}${
                      detectedIdentity.designation
                        ? ` (${detectedIdentity.designation.toUpperCase()})`
                        : ' (Default Patient)'
                    }`
                  : 'Default Role: PATIENT • Admin decides & assigns Doctor / Staff roles'}
              </Text>
            </View>

            {/* Error Message Alert */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Unified Email / Role ID Field */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Mail size={20} color="#64748B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Email or Role ID (PAT-1001 / DOC-2001 / STF-3001)"
                placeholderTextColor="#94A3B8"
                value={identifier}
                onChangeText={(text) => {
                  setIdentifier(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Field with Eye Toggle */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Lock size={20} color="#64748B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#64748B" />
                ) : (
                  <Eye size={20} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>

            {/* Login CTA Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => handleLogin()}
              disabled={isSubmitting}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Login"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password Link */}
            <View style={styles.forgotPasswordRow}>
              <TouchableOpacity
                onPress={handleForgotPassword}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Forgot Password"
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Footer: Register Link */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>New User? </Text>
              <TouchableOpacity onPress={handleRegister} activeOpacity={0.7}>
                <Text style={styles.registerLink}>Register Here</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 1-Tap Quick Demo Credentials for Unified Login Testing */}
          <View style={styles.demoCard}>
            <View style={styles.demoHeaderRow}>
              <KeyRound size={15} color="#0866C6" />
              <Text style={styles.demoHeaderTitle}>
                Quick Demo Sign-In (Tap to Auto-Fill &amp; Login by Role ID / Email)
              </Text>
            </View>
            <View style={styles.demoList}>
              {DEMO_ACCOUNTS.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={styles.demoChip}
                  onPress={() => {
                    setIdentifier(acc.email);
                    setPassword(acc.pass);
                    void handleLogin(acc.email, acc.pass);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.demoBadge, { backgroundColor: acc.badgeBg }]}>
                    <Text style={[styles.demoBadgeText, { color: acc.badgeColor }]}>
                      {acc.id}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoLabel}>{acc.label}</Text>
                    <Text style={styles.demoSub}>{acc.sub} • Pass: {acc.pass}</Text>
                  </View>
                  <Text style={styles.demoActionText}>Sign In →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 36,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#142D4E',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0866C6',
    marginTop: 2,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 18,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
    textAlign: 'center',
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  identityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  identityBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#064A91',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#142D4E',
    paddingVertical: 0,
  },
  passwordToggle: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#0866C6',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  forgotPasswordRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0866C6',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0866C6',
  },
  demoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  demoHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
    flex: 1,
  },
  demoList: {
    gap: 8,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  demoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  demoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  demoSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  demoActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
});

export default LoginScreen;
