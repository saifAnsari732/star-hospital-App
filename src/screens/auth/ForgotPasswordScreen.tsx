import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthNavigationProp, AuthRouteProp } from '../../navigation/navigationTypes';
import {
  ChevronLeft,
  Phone,
  KeyRound,
  AlertCircle,
} from 'lucide-react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { authService } from '../../services/authService';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'ForgotPassword'>>();
  const route = useRoute<AuthRouteProp<'ForgotPassword'>>();

  const role = route.params?.role || 'patient';

  const [identifier, setIdentifier] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendCode = async () => {
    setErrorMessage(null);
    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered mobile number or email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ emailOrPhone: identifier.trim() });
      navigation.navigate('ResetPassword', {
        identifier: identifier.trim(),
        role,
      });
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Unable to send reset code. Please check your details.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Nav Header */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ChevronLeft size={24} color="#142D4E" />
            </TouchableOpacity>
          </View>

          {/* Icon Header */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <KeyRound size={28} color="#0866C6" strokeWidth={2.2} />
            </View>
          </View>

          {/* Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your registered contact info to receive a secure password reset code.
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form: Identifier Entry */}
          <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Phone size={20} color="#94A3B8" />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Mobile Number or Email"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onChangeText={(val) => {
                    setIdentifier(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSendCode}
                disabled={isSubmitting}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel="Send Reset Code"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Send Reset Code</Text>
                )}
              </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 36,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
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
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  successText: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    fontSize: 15,
    color: '#142D4E',
    paddingVertical: 0,
  },
  passwordToggle: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#0866C6',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ForgotPasswordScreen;
