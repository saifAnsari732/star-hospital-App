import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthNavigationProp, AuthRouteProp } from '../../navigation/navigationTypes';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services';
import { ChevronLeft, AlertCircle } from 'lucide-react-native';
import { TEMPLATE_IMAGES } from '../../assets/images';

export const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'OTPVerification'>>();
  const route = useRoute<AuthRouteProp<'OTPVerification'>>();
  const { loginWithOtp } = useAuth();

  const phone = route.params?.phone || '+91 98765 43210';
  const role = route.params?.role || 'patient';
  const isRegistration = route.params?.isRegistration || false;
  const flow = route.params?.flow;

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(30);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<Array<React.ComponentRef<typeof TextInput> | null>>([]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleDigitChange = (value: string, index: number) => {
    setErrorMessage(null);

    // Support fast paste of full 6-digit code
    if (value.length > 1) {
      const cleanDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      cleanDigits.forEach((digit, i) => {
        if (i < 6) newDigits[i] = digit;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(cleanDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);

    // Auto-advance to next input field
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown === 0) {
      setCountdown(30);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setErrorMessage(null);
      try {
        await authService.requestPhoneOtp({ phone, role });
      } catch (err: any) {
        setErrorMessage(err?.message || 'Unable to resend verification code.');
      }
    }
  };

  const fullOtp = otpDigits.join('');

  const handleVerify = async () => {
    if (fullOtp.length < 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage(null);

      if (flow === 'reset') {
        navigation.navigate('ResetPassword', {
          identifier: phone,
          role,
          verificationCode: fullOtp,
        });
      } else if (isRegistration) {
        navigation.navigate('ProfileSetup', {
          role,
          registrationData: route.params?.registrationData,
        });
      } else {
        await loginWithOtp(phone, fullOtp, role);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid OTP code. Please check and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const s = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `00:${s}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Navigation Bar */}
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

        {/* Brand Emblem */}
        <View style={styles.brandEmblemContainer}>
          <Image
            source={TEMPLATE_IMAGES.starLogo}
            style={{ width: 72, height: 58 }}
            resizeMode="contain"
          />
        </View>

        {/* Heading & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6 digit code sent to{'\n'}
            <Text style={styles.phoneHighlight}>{phone}</Text>
          </Text>
        </View>

        {/* Error Alert */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* 6 Square Input Boxes */}
        <View style={styles.otpGrid}>
          {otpDigits.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => {
                inputRefs.current[idx] = ref;
              }}
              onFocus={() => setFocusedIndex(idx)}
              onBlur={() => setFocusedIndex((prev) => (prev === idx ? null : prev))}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                focusedIndex === idx ? styles.otpBoxFocused : null,
              ]}
              value={digit}
              onChangeText={(val) => handleDigitChange(val, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              accessibilityLabel={`OTP digit ${idx + 1}`}
            />
          ))}
        </View>

        {/* Resend Action */}
        <View style={styles.resendContainer}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              Resend OTP ({formatTimer(countdown)})
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <Text style={styles.resendActiveText}>Resend OTP Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Action Button */}
        <TouchableOpacity
          style={[styles.verifyButton, fullOtp.length < 6 && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isVerifying}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Verify OTP"
        >
          {isVerifying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
    paddingTop: 8,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  brandEmblemContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
  phoneHighlight: {
    fontWeight: '700',
    color: '#142D4E',
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
    marginBottom: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  otpBox: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    fontSize: 22,
    fontWeight: '700',
    color: '#142D4E',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  otpBoxFilled: {
    borderColor: '#0866C6',
    backgroundColor: '#F0F7FF',
  },
  otpBoxFocused: {
    borderColor: '#0866C6',
    borderWidth: 2,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  resendActiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0866C6',
  },
  verifyButton: {
    backgroundColor: '#0866C6',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  verifyButtonDisabled: {
    opacity: 0.65,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default OTPVerificationScreen;
