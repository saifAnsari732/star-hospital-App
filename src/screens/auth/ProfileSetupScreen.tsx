import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthNavigationProp, AuthRouteProp } from '../../navigation/navigationTypes';
import { PatientRegisterData } from '../../types/auth';
import { profileService } from '../../services';
import {
  Camera,
  Heart,
  PhoneCall,
  ShieldAlert,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react-native';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;

export const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'ProfileSetup'>>();
  const route = useRoute<AuthRouteProp<'ProfileSetup'>>();
  const incomingReg = route.params?.registrationData;

  const [selectedBloodGroup, setSelectedBloodGroup] = useState<PatientRegisterData['bloodGroup']>(
    incomingReg?.bloodGroup || 'B+'
  );
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [allergies, setAllergies] = useState<string>('');
  const [medicalConditions, setMedicalConditions] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    const updatedRegistration = incomingReg
      ? {
          ...incomingReg,
          bloodGroup: selectedBloodGroup,
        }
      : undefined;
    try {
      if (!updatedRegistration) {
        await profileService.updateProfile({
          bloodGroup: selectedBloodGroup,
          emergencyContact: emergencyPhone.trim()
            ? {
                name: 'Emergency Contact',
                relation: 'Family',
                phone: emergencyPhone.trim(),
              }
            : undefined,
        });
      }
    } catch {
      // Proceed even if backend staging endpoint falls back locally
    } finally {
      setIsSaving(false);
    }
    navigation.navigate('NotificationPermission', {
      role: route.params?.role || 'patient',
      registrationData: updatedRegistration,
    });
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

          {/* Heading */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Health Profile</Text>
            <Text style={styles.subtitle}>
              Adding your emergency details helps doctors provide rapid, personalized clinical care.
            </Text>
          </View>

          {/* Avatar / Photo Upload Placeholder */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>SH</Text>
              <TouchableOpacity
                style={styles.cameraBadge}
                onPress={() =>
                  Alert.alert(
                    'Profile Photo Staging',
                    'Photo selection uses your device gallery permission once native media picker is linked.'
                  )
                }
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Upload photo"
              >
                <Camera size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.uploadPhotoText}>Upload Profile Picture</Text>
          </View>

          {/* Blood Group Selector */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Heart size={18} color="#DC2626" />
              <Text style={styles.sectionLabel}>Blood Group</Text>
            </View>
            <View style={styles.bloodGroupGrid}>
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = selectedBloodGroup === bg;
                return (
                  <TouchableOpacity
                    key={bg}
                    style={[
                      styles.bloodChip,
                      isSelected && styles.bloodChipActive,
                    ]}
                    onPress={() => setSelectedBloodGroup(bg)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.bloodChipText,
                        isSelected && styles.bloodChipTextActive,
                      ]}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <PhoneCall size={18} color="#0866C6" />
              <Text style={styles.sectionLabel}>Emergency Contact Number</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="+91 Emergency Contact Phone"
                placeholderTextColor="#94A3B8"
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Known Allergies */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <ShieldAlert size={18} color="#F59E0B" />
              <Text style={styles.sectionLabel}>Known Allergies (Optional)</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Penicillin, Peanuts, Sulfa drugs, None"
                placeholderTextColor="#94A3B8"
                value={allergies}
                onChangeText={setAllergies}
              />
            </View>
          </View>

          {/* Pre-existing Medical Conditions */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabelNoIcon}>Pre-existing Conditions (Optional)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Hypertension, Diabetes, Asthma, None"
                placeholderTextColor="#94A3B8"
                value={medicalConditions}
                onChangeText={setMedicalConditions}
              />
            </View>
          </View>

          {/* Save & Continue CTA */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveAndContinue}
            disabled={isSaving}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Save profile and continue"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save & Continue</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
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
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    borderWidth: 2,
    borderColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0866C6',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0866C6',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  uploadPhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0866C6',
  },
  sectionContainer: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    marginLeft: 6,
  },
  sectionLabelNoIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 8,
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  bloodChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  bloodChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  bloodChipTextActive: {
    color: '#FFFFFF',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    color: '#142D4E',
  },
  saveButton: {
    backgroundColor: '#0866C6',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default ProfileSetupScreen;
