import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  HeartPulse,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { Patient } from '../../types/patient';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patientService';
import { profileService } from '../../services/profileService';
import { StarHeader, StarCard, StarInput, StarButton } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';
import { resolveEffectivePatientId } from './patientUtils';
import { TEMPLATE_IMAGES } from '../../assets/images';

type Props = NativeStackScreenProps<PatientStackParamList, 'EditProfile'>;
type BloodGroup = NonNullable<Patient['bloodGroup']>;

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);

  const [mrn, setMrn] = useState(effectivePatientId.toUpperCase());
  const [name, setName] = useState(user?.name || 'Ali Khan');
  const [phone, setPhone] = useState(user?.phone || '+92 300 1234567');
  const [email, setEmail] = useState(user?.email || 'ali.khan@gmail.com');
  const [address, setAddress] = useState('House 45, Street 12, Sector F-8/2');
  const [city, setCity] = useState('Islamabad');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [emergencyName, setEmergencyName] = useState('Rashid Khan');
  const [emergencyRelation, setEmergencyRelation] = useState('Father');
  const [emergencyPhone, setEmergencyPhone] = useState('+92 300 7654321');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const profile = await patientService.getProfile(effectivePatientId);
        if (active && profile) {
          if (profile.mrn) setMrn(profile.mrn);
          if (profile.name) setName(profile.name);
          if (profile.phone) setPhone(profile.phone);
          if (profile.email) setEmail(profile.email);
          if (profile.address) setAddress(profile.address);
          if (profile.city) setCity(profile.city);
          if (profile.bloodGroup && BLOOD_GROUPS.includes(profile.bloodGroup as BloodGroup)) {
            setBloodGroup(profile.bloodGroup as BloodGroup);
          }
          if (profile.emergencyContact) {
            setEmergencyName(profile.emergencyContact.name);
            setEmergencyRelation(profile.emergencyContact.relation);
            setEmergencyPhone(profile.emergencyContact.phone);
          }
        }
      } catch {
        // Keep user context defaults
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [effectivePatientId]);

  const handleAvatarTap = async () => {
    try {
      await profileService.uploadAvatar('local://avatar-preview.jpg');
      Alert.alert(
        'Profile Photo',
        'Profile avatar picker requires native camera/gallery selection; sample profile photo URL is staged.'
      );
    } catch {
      Alert.alert('Profile Photo', 'Unable to update avatar right now.');
    }
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSavedMsg(null);

    if (!name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Enter a valid mobile number with at least 10 digits.');
      return;
    }

    setIsSaving(true);
    try {
      await profileService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        bloodGroup,
        emergencyContact: {
          name: emergencyName.trim(),
          relation: emergencyRelation.trim(),
          phone: emergencyPhone.trim(),
        },
      });
      await patientService.updateProfile(effectivePatientId, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        bloodGroup,
        emergencyContact: {
          name: emergencyName.trim(),
          relation: emergencyRelation.trim(),
          phone: emergencyPhone.trim(),
        },
      });
      setSavedMsg('Your patient profile details have been updated.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to save profile updates.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader title="Edit Profile" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar Header */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Image
                  source={TEMPLATE_IMAGES.patientRahul}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={handleAvatarTap}
                  style={styles.cameraBadge}
                  activeOpacity={0.8}
                >
                  <Camera size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
              <Text style={styles.mrnCaption}>
                MRN: {mrn}
              </Text>
            </View>

            {savedMsg ? (
              <View style={styles.successBanner}>
                <CheckCircle2 size={18} color={colors.success} />
                <Text style={styles.successText}>{savedMsg}</Text>
              </View>
            ) : null}

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color={colors.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <StarCard style={styles.formCard} variant="elevated">
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <StarInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                leftIcon={<User size={18} color={colors.primary} />}
              />
              <StarInput
                label="Mobile Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                leftIcon={<Phone size={18} color={colors.primary} />}
              />
              <StarInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={18} color={colors.primary} />}
              />
              <StarInput
                label="Street Address"
                value={address}
                onChangeText={setAddress}
                leftIcon={<MapPin size={18} color={colors.primary} />}
              />
              <StarInput label="City" value={city} onChangeText={setCity} />

              <View style={styles.bloodHeadingRow}>
                <HeartPulse size={16} color={colors.danger} />
                <Text style={styles.bloodHeading}>Blood Group</Text>
              </View>
              <View style={styles.bloodGrid}>
                {BLOOD_GROUPS.map((bg) => {
                  const active = bloodGroup === bg;
                  return (
                    <TouchableOpacity
                      key={bg}
                      onPress={() => setBloodGroup(bg)}
                      style={[
                        styles.bloodPill,
                        active ? styles.bloodPillActive : undefined,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bloodText,
                          active ? styles.bloodTextActive : undefined,
                        ]}
                      >
                        {bg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </StarCard>

            <StarCard style={styles.formCard} variant="elevated">
              <Text style={styles.sectionTitle}>Emergency Contact</Text>
              <StarInput
                label="Contact Name"
                value={emergencyName}
                onChangeText={setEmergencyName}
              />
              <StarInput
                label="Relationship"
                value={emergencyRelation}
                onChangeText={setEmergencyRelation}
              />
              <StarInput
                label="Emergency Phone"
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
              />
            </StarCard>

            <StarButton
              title={isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving}
              fullWidth
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xs },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.white },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.tealAccent,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mrnCaption: { ...typography.labelMedium, color: colors.primary, marginTop: spacing.xs },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  successText: { ...typography.bodySmall, color: colors.success, flex: 1 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  errorText: { ...typography.bodySmall, color: colors.danger, flex: 1 },
  formCard: { padding: spacing.lg, borderRadius: radii.xl },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  bloodHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  bloodHeading: { ...typography.labelMedium, color: colors.textPrimary },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  bloodPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  bloodPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  bloodText: { ...typography.labelMedium, color: colors.textPrimary },
  bloodTextActive: { color: colors.white },
});
