import React, { useState, useMemo } from 'react';
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
  Eye,
  EyeOff,
  Calendar,
  Users,
  MapPin,
  ChevronDown,
  AlertCircle,
  Check,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react-native';
import { TEMPLATE_IMAGES } from '../../assets/images';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

const calculateAge = (dobString: string): number | null => {
  if (!dobString) return null;
  const parts = dobString.trim().split('-');
  if (parts.length !== 3) return null;
  const birth = new Date(dobString.trim());
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

export const PatientRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'PatientRegistration'>>();
  const { registerPatient } = useAuth();

  // Form Fields State
  const [fullName, setFullName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [address, setAddress] = useState<string>('');
  const [city] = useState<string>('Mumbai');
  const [bloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('B+');

  // Modals
  const [showGenderModal, setShowGenderModal] = useState<boolean>(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState<boolean>(false);

  // Date Picker Temp State for Year, Month, Day selection
  const currentYear = new Date().getFullYear();
  const [tempYear, setTempYear] = useState<number>(1998);
  const [tempMonth, setTempMonth] = useState<number>(6);
  const [tempDay, setTempDay] = useState<number>(15);

  // Focus & Validation State
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // List of available years (currentYear down to 1930)
  const availableYears = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y >= 1930; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  // List of available days for current tempYear and tempMonth
  const availableDays = useMemo(() => {
    const max = getDaysInMonth(tempYear, tempMonth);
    const list: number[] = [];
    for (let d = 1; d <= max; d++) {
      list.push(d);
    }
    return list;
  }, [tempYear, tempMonth]);

  // Single field validation rule
  const validateField = (field: string, val: string): string | undefined => {
    switch (field) {
      case 'fullName': {
        const trimmed = val.trim();
        if (!trimmed) return 'Full Name is required.';
        if (trimmed.length < 3) return 'Name must be at least 3 characters.';
        if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
          return 'Name can only contain letters and spaces.';
        }
        return undefined;
      }
      case 'mobileNumber': {
        const digits = val.replace(/\D/g, '');
        if (!digits) return 'Mobile Number is required.';
        if (digits.length < 10) {
          return `Please enter a valid mobile number (${digits.length}/10 digits).`;
        }
        if (digits.length > 15) {
          return 'Mobile number cannot exceed 15 digits.';
        }
        return undefined;
      }
      case 'emailAddress': {
        const trimmed = val.trim();
        if (!trimmed) return 'Email Address is required.';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmed)) {
          return 'Please enter a valid email address (e.g. name@example.com).';
        }
        return undefined;
      }
      case 'password': {
        if (!val) return 'Password is required.';
        if (val.length < 6) {
          return `Password must be at least 6 characters (${val.length}/6).`;
        }
        return undefined;
      }
      case 'dateOfBirth': {
        if (!val || !val.trim()) return 'Please choose your Date of Birth.';
        const parts = val.trim().split('-');
        if (parts.length !== 3) return 'Date of Birth must be in YYYY-MM-DD format.';
        const bDate = new Date(val.trim());
        if (isNaN(bDate.getTime())) return 'Invalid date of birth.';
        const today = new Date();
        if (bDate > today) return 'Date of birth cannot be in the future.';
        const age = today.getFullYear() - bDate.getFullYear();
        if (age > 125) return 'Please choose a realistic date of birth.';
        return undefined;
      }
      case 'address': {
        const trimmed = val.trim();
        if (!trimmed) return 'Address is required.';
        if (trimmed.length < 5) return 'Address must be at least 5 characters.';
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const handleBlur = (field: string, value: string) => {
    setFocusedField(null);
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChangeText = (field: string, val: string, setter: (v: string) => void) => {
    setter(val);
    if (touched[field]) {
      const err = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  // Password strength meter
  const passwordStrength = useMemo(() => {
    if (!password) return { label: '', color: '#CBD5E1', bars: 0 };
    if (password.length < 6) return { label: 'Too short (min. 6)', color: '#EF4444', bars: 1 };
    let score = 1;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score >= 4) return { label: 'Strong password', color: '#16A34A', bars: 4 };
    if (score === 3) return { label: 'Good password', color: '#0284C7', bars: 3 };
    return { label: 'Fair password', color: '#D97706', bars: 2 };
  }, [password]);

  // Open Date Picker Modal and seed with existing or default values
  const handleOpenDatePicker = () => {
    if (dateOfBirth) {
      const parts = dateOfBirth.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setTempYear(y);
          setTempMonth(m);
          setTempDay(d);
        }
      }
    } else {
      setTempYear(1998);
      setTempMonth(6);
      setTempDay(15);
    }
    setShowDatePickerModal(true);
  };

  // Confirm Date from Modal
  const handleConfirmDate = () => {
    const formatted = `${tempYear}-${String(tempMonth).padStart(2, '0')}-${String(tempDay).padStart(2, '0')}`;
    setDateOfBirth(formatted);
    setShowDatePickerModal(false);
    setTouched((prev) => ({ ...prev, dateOfBirth: true }));
    const err = validateField('dateOfBirth', formatted);
    setErrors((prev) => ({ ...prev, dateOfBirth: err }));
    if (errorMessage) setErrorMessage(null);
  };

  // Formatted date preview for display
  const formattedDobDisplay = useMemo(() => {
    if (!dateOfBirth) return '';
    const parts = dateOfBirth.split('-');
    if (parts.length !== 3) return dateOfBirth;
    const y = parts[0];
    const mIdx = parseInt(parts[1], 10) - 1;
    const d = parts[2];
    const monthName = MONTH_NAMES[mIdx] || parts[1];
    const age = calculateAge(dateOfBirth);
    return age !== null ? `${d} ${monthName} ${y} • ${age} yrs` : `${d} ${monthName} ${y}`;
  }, [dateOfBirth]);

  const handleRegister = async () => {
    setErrorMessage(null);

    const nameErr = validateField('fullName', fullName);
    const phoneErr = validateField('mobileNumber', mobileNumber);
    const emailErr = validateField('emailAddress', emailAddress);
    const passErr = validateField('password', password);
    const dobErr = validateField('dateOfBirth', dateOfBirth);
    const addrErr = validateField('address', address);

    const newErrors = {
      fullName: nameErr,
      mobileNumber: phoneErr,
      emailAddress: emailErr,
      password: passErr,
      dateOfBirth: dobErr,
      address: addrErr,
    };

    setErrors(newErrors);
    setTouched({
      fullName: true,
      mobileNumber: true,
      emailAddress: true,
      password: true,
      dateOfBirth: true,
      address: true,
    });

    const hasError = Object.values(newErrors).some(Boolean);
    if (hasError) {
      const firstError =
        nameErr || phoneErr || emailErr || passErr || dobErr || addrErr;
      setErrorMessage(firstError || 'Please fix the highlighted fields to continue.');
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

  const getBorderColor = (field: string) => {
    if (touched[field] && errors[field]) return '#EF4444';
    if (focusedField === field) return '#0866C6';
    if (touched[field] && !errors[field]) return '#22C55E';
    return '#E2E8F0';
  };

  const getBackgroundColor = (field: string) => {
    if (touched[field] && errors[field]) return '#FEF2F2';
    return '#FFFFFF';
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

          {/* Top Error Alert Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* 1. Full Name */}
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: getBorderColor('fullName'),
                  backgroundColor: getBackgroundColor('fullName'),
                },
              ]}
            >
              <View style={styles.inputIconContainer}>
                <User size={20} color={errors.fullName && touched.fullName ? '#EF4444' : '#64748B'} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={(v) => handleChangeText('fullName', v, setFullName)}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => handleBlur('fullName', fullName)}
                autoCapitalize="words"
              />
              {touched.fullName && !errors.fullName && fullName.trim().length >= 3 ? (
                <CheckCircle2 size={18} color="#16A34A" />
              ) : null}
            </View>
            {touched.fullName && errors.fullName ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={13} color="#DC2626" />
                <Text style={styles.fieldErrorText}>{errors.fullName}</Text>
              </View>
            ) : null}

            {/* 2. Mobile Number */}
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: getBorderColor('mobileNumber'),
                  backgroundColor: getBackgroundColor('mobileNumber'),
                },
              ]}
            >
              <View style={styles.inputIconContainer}>
                <Phone size={20} color={errors.mobileNumber && touched.mobileNumber ? '#EF4444' : '#64748B'} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Mobile Number"
                placeholderTextColor="#94A3B8"
                value={mobileNumber}
                onChangeText={(v) => handleChangeText('mobileNumber', v, setMobileNumber)}
                onFocus={() => setFocusedField('mobileNumber')}
                onBlur={() => handleBlur('mobileNumber', mobileNumber)}
                keyboardType="phone-pad"
              />
              {touched.mobileNumber && !errors.mobileNumber && mobileNumber.replace(/\D/g, '').length >= 10 ? (
                <CheckCircle2 size={18} color="#16A34A" />
              ) : null}
            </View>
            {touched.mobileNumber && errors.mobileNumber ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={13} color="#DC2626" />
                <Text style={styles.fieldErrorText}>{errors.mobileNumber}</Text>
              </View>
            ) : null}

            {/* 3. Email Address */}
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: getBorderColor('emailAddress'),
                  backgroundColor: getBackgroundColor('emailAddress'),
                },
              ]}
            >
              <View style={styles.inputIconContainer}>
                <Mail size={20} color={errors.emailAddress && touched.emailAddress ? '#EF4444' : '#64748B'} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Email Address"
                placeholderTextColor="#94A3B8"
                value={emailAddress}
                onChangeText={(v) => handleChangeText('emailAddress', v, setEmailAddress)}
                onFocus={() => setFocusedField('emailAddress')}
                onBlur={() => handleBlur('emailAddress', emailAddress)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {touched.emailAddress && !errors.emailAddress && emailAddress.includes('@') ? (
                <CheckCircle2 size={18} color="#16A34A" />
              ) : null}
            </View>
            {touched.emailAddress && errors.emailAddress ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={13} color="#DC2626" />
                <Text style={styles.fieldErrorText}>{errors.emailAddress}</Text>
              </View>
            ) : null}

            {/* 4. Password */}
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: getBorderColor('password'),
                  backgroundColor: getBackgroundColor('password'),
                },
              ]}
            >
              <View style={styles.inputIconContainer}>
                <Lock size={20} color={errors.password && touched.password ? '#EF4444' : '#64748B'} />
              </View>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={(v) => handleChangeText('password', v, setPassword)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => handleBlur('password', password)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIconButton}
                onPress={() => setShowPassword((prev) => !prev)}
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
            {/* Password Strength Meter */}
            {password.length > 0 ? (
              <View style={styles.passwordStrengthRow}>
                <View style={styles.strengthBarsContainer}>
                  {[1, 2, 3, 4].map((bar) => (
                    <View
                      key={bar}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            bar <= passwordStrength.bars
                              ? passwordStrength.color
                              : '#E2E8F0',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            ) : null}
            {touched.password && errors.password ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={13} color="#DC2626" />
                <Text style={styles.fieldErrorText}>{errors.password}</Text>
              </View>
            ) : null}

            {/* 5. Date of Birth (Interactive Chooser & Formatter - "choose data not write") */}
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: getBorderColor('dateOfBirth'),
                  backgroundColor: getBackgroundColor('dateOfBirth'),
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleOpenDatePicker}
                style={styles.inputIconContainer}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Open date picker modal"
              >
                <Calendar size={20} color={errors.dateOfBirth && touched.dateOfBirth ? '#EF4444' : '#0866C6'} />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Date of Birth (YYYY-MM-DD)"
                placeholderTextColor="#94A3B8"
                value={dateOfBirth}
                onChangeText={(v) => handleChangeText('dateOfBirth', v, setDateOfBirth)}
                onFocus={() => setFocusedField('dateOfBirth')}
                onBlur={() => handleBlur('dateOfBirth', dateOfBirth)}
              />
              <TouchableOpacity
                style={styles.chooseDateChip}
                onPress={handleOpenDatePicker}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Choose date from calendar"
              >
                <Text style={styles.chooseDateChipText}>
                  {dateOfBirth && calculateAge(dateOfBirth) !== null
                    ? `${calculateAge(dateOfBirth)} yrs`
                    : 'Choose'}
                </Text>
                <ChevronDown size={14} color="#0866C6" />
              </TouchableOpacity>
            </View>
            {touched.dateOfBirth && errors.dateOfBirth ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={13} color="#DC2626" />
                <Text style={styles.fieldErrorText}>{errors.dateOfBirth}</Text>
              </View>
            ) : null}

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
            <View
              style={[
                styles.inputWrapper,
                {
                  borderColor: getBorderColor('address'),
                  backgroundColor: getBackgroundColor('address'),
                },
              ]}
            >
              <View style={styles.inputIconContainer}>
                <MapPin size={20} color={errors.address && touched.address ? '#EF4444' : '#64748B'} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Address"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={(v) => handleChangeText('address', v, setAddress)}
                onFocus={() => setFocusedField('address')}
                onBlur={() => handleBlur('address', address)}
              />
              {touched.address && !errors.address && address.trim().length >= 5 ? (
                <CheckCircle2 size={18} color="#16A34A" />
              ) : null}
            </View>
            {touched.address && errors.address ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={13} color="#DC2626" />
                <Text style={styles.fieldErrorText}>{errors.address}</Text>
              </View>
            ) : null}

            {/* Register CTA Button */}
            <TouchableOpacity
              style={[styles.registerButton, isSubmitting && { opacity: 0.8 }]}
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

      {/* Date of Birth Chooser Modal ("choose data not write") */}
      <Modal visible={showDatePickerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModalContent}>
            {/* Header */}
            <View style={styles.dateModalHeader}>
              <View>
                <Text style={styles.dateModalTitle}>Select Date of Birth</Text>
                <Text style={styles.dateModalSubtitle}>Choose Day, Month, and Year</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDatePickerModal(false)}
                style={styles.dateModalCloseBtn}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Live Preview Banner */}
            <View style={styles.datePreviewBox}>
              <View style={styles.datePreviewLeft}>
                <Calendar size={18} color="#0866C6" />
                <Text style={styles.datePreviewText}>
                  {tempDay} {FULL_MONTH_NAMES[tempMonth - 1]} {tempYear}
                </Text>
              </View>
              <View style={styles.ageBadge}>
                <Text style={styles.ageBadgeText}>
                  Age: {calculateAge(`${tempYear}-${String(tempMonth).padStart(2, '0')}-${String(tempDay).padStart(2, '0')}`) ?? 0} yrs
                </Text>
              </View>
            </View>

            {/* 3 Interactive Columns */}
            <View style={styles.dateColumnsContainer}>
              {/* Day Column */}
              <View style={styles.dateCol}>
                <Text style={styles.dateColTitle}>Day</Text>
                <ScrollView style={styles.dateColScroll} showsVerticalScrollIndicator={false}>
                  {availableDays.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.dateColItem,
                        tempDay === d && styles.dateColItemActive,
                      ]}
                      onPress={() => setTempDay(d)}
                    >
                      <Text
                        style={[
                          styles.dateColItemText,
                          tempDay === d && styles.dateColItemTextActive,
                        ]}
                      >
                        {d < 10 ? `0${d}` : d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Column */}
              <View style={styles.dateCol}>
                <Text style={styles.dateColTitle}>Month</Text>
                <ScrollView style={styles.dateColScroll} showsVerticalScrollIndicator={false}>
                  {MONTH_NAMES.map((m, idx) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.dateColItem,
                        tempMonth === idx + 1 && styles.dateColItemActive,
                      ]}
                      onPress={() => {
                        const newM = idx + 1;
                        setTempMonth(newM);
                        const maxD = getDaysInMonth(tempYear, newM);
                        if (tempDay > maxD) setTempDay(maxD);
                      }}
                    >
                      <Text
                        style={[
                          styles.dateColItemText,
                          tempMonth === idx + 1 && styles.dateColItemTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Column */}
              <View style={styles.dateCol}>
                <Text style={styles.dateColTitle}>Year</Text>
                <ScrollView style={styles.dateColScroll} showsVerticalScrollIndicator={false}>
                  {availableYears.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.dateColItem,
                        tempYear === y && styles.dateColItemActive,
                      ]}
                      onPress={() => {
                        setTempYear(y);
                        const maxD = getDaysInMonth(y, tempMonth);
                        if (tempDay > maxD) setTempDay(maxD);
                      }}
                    >
                      <Text
                        style={[
                          styles.dateColItemText,
                          tempYear === y && styles.dateColItemTextActive,
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.dateModalActions}>
              <TouchableOpacity
                style={styles.dateCancelBtn}
                onPress={() => setShowDatePickerModal(false)}
              >
                <Text style={styles.dateCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateConfirmBtn}
                onPress={handleConfirmDate}
              >
                <Text style={styles.dateConfirmBtnText}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
  selectedDobText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  chooseDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chooseDateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  passwordStrengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  strengthBarsContainer: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: 12,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
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
  eyeIconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
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

  // Date Chooser Modal Styles
  datePickerModalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 10,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  dateModalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  datePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  datePreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePreviewText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  ageBadge: {
    backgroundColor: '#0866C6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dateColumnsContainer: {
    flexDirection: 'row',
    gap: 8,
    height: 180,
    marginBottom: 18,
  },
  dateCol: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
  },
  dateColTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateColScroll: {
    flex: 1,
  },
  dateColItem: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 3,
  },
  dateColItemActive: {
    backgroundColor: '#0866C6',
  },
  dateColItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  dateColItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dateModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  dateCancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  dateConfirmBtn: {
    flex: 1.6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  dateConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default PatientRegistrationScreen;
