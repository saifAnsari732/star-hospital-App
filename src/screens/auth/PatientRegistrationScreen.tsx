import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../../navigation/navigationTypes';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft,
  User,
  Phone,
  Mail,
  Lock,
  Calendar,
  Users,
  MapPin,
  ChevronDown,
  AlertCircle,
  Check,
} from 'lucide-react-native';
import { TEMPLATE_IMAGES } from '../../assets/images';

export const PatientRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'PatientRegistration'>>();
  const { registerPatient } = useAuth();

  const [fullName, setFullName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [address, setAddress] = useState<string>('');
  const [city] = useState<string>('Mumbai');
  const [bloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('B+');

  const [showGenderModal, setShowGenderModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!mobileNumber.trim() || mobileNumber.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!emailAddress.trim() || !emailAddress.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!dateOfBirth.trim()) {
      setErrorMessage('Please enter your date of birth (e.g. 1995-06-20).');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Please enter your home address.');
      return;
    }

    try {
      setIsSubmitting(true);
      await registerPatient({
        name: fullName.trim(),
        phone: mobileNumber.trim(),
        email: emailAddress.trim(),
        password: password.trim() || 'Star@123',
        dateOfBirth: dateOfBirth.trim(),
        gender,
        bloodGroup,
        address: address.trim(),
        city: city.trim(),
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const genderOptions: Array<{ label: string; value: 'male' | 'female' | 'other' }> = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

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
              accessibilityLabel="Back to Login"
            >
              <ChevronLeft size={24} color="#142D4E" />
            </TouchableOpacity>
          </View>

          {/* Centered Small Star Emblem */}
          <View style={styles.brandEmblemContainer}>
            <Image
              source={TEMPLATE_IMAGES.starLogo}
              style={{ width: 64, height: 52 }}
              resizeMode="contain"
            />
          </View>

          {/* Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Patient Registration</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          {/* Error Message Alert */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Fields matching Reference UI Image */}
          <View style={styles.formContainer}>
            {/* 1. Full Name */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <User size={20} color="#64748B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* 2. Mobile Number */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Phone size={20} color="#64748B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Mobile Number"
                placeholderTextColor="#94A3B8"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
              />
            </View>

            {/* 3. Email Address */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Mail size={20} color="#64748B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Email Address"
                placeholderTextColor="#94A3B8"
                value={emailAddress}
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* 4. Password */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Lock size={20} color="#64748B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* 5. Date of Birth */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Calendar size={20} color="#64748B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Date of Birth (YYYY-MM-DD)"
                placeholderTextColor="#94A3B8"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
            </View>

            {/* 6. Gender Dropdown */}
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowGenderModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select Gender"
            >
              <View style={styles.inputIconContainer}>
                <Users size={20} color="#64748B" />
              </View>
              <Text style={styles.pickerText}>
                {gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other'}
              </Text>
              <ChevronDown size={20} color="#64748B" />
            </TouchableOpacity>

            {/* 7. Address */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <MapPin size={20} color="#64748B" />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Address"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* Register CTA Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Register account"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Gender Selection Modal */}
      <Modal visible={showGenderModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {genderOptions.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.modalOption, gender === item.value && styles.modalOptionActive]}
                onPress={() => {
                  setGender(item.value);
                  setShowGenderModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    gender === item.value && styles.modalOptionTextActive,
                  ]}
                >
                  {item.label}
                </Text>
                {gender === item.value && <Check size={18} color="#0866C6" strokeWidth={2.5} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGenderModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  brandEmblemContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
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
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
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
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 12,
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
  pickerText: {
    flex: 1,
    fontSize: 15,
    color: '#142D4E',
  },
  registerButton: {
    backgroundColor: '#0866C6',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  modalOptionActive: {
    backgroundColor: '#EBF4FF',
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#142D4E',
  },
  modalOptionTextActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PatientRegistrationScreen;
