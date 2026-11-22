import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../../navigation/navigationTypes';
import { UserRole } from '../../types/user';
import { User, Stethoscope, ShieldCheck, Check, ArrowRight } from 'lucide-react-native';

interface RoleOption {
  role: UserRole;
  title: string;
  tagline: string;
  description: string;
  badge: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'patient',
    title: 'Patient Portal',
    tagline: 'Personal Healthcare',
    description:
      'Book doctor appointments, track live OPD token queue position, and access diagnostic reports and prescriptions.',
    badge: 'Popular',
  },
  {
    role: 'doctor',
    title: 'Doctor Portal',
    tagline: 'Clinical Management',
    description:
      'Manage consultations, call the next patient in queue, review medical histories, and build verified digital prescriptions.',
    badge: 'Specialists',
  },
  {
    role: 'staff',
    title: 'Hospital Staff',
    tagline: 'Operations & Nursing',
    description:
      'Front-desk reception, nurse vitals entry, laboratory worklist, pharmacy dispensing, billing, and bed allocations.',
    badge: 'Hospital Ops',
  },
];

export const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'RoleSelection'>>();
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');

  const handleContinue = () => {
    navigation.navigate('Login', { role: selectedRole });
  };

  const getRoleIcon = (role: UserRole, isSelected: boolean) => {
    const iconColor = isSelected ? '#FFFFFF' : '#0866C6';
    if (role === 'patient') return <User size={24} color={iconColor} strokeWidth={2} />;
    if (role === 'doctor') return <Stethoscope size={24} color={iconColor} strokeWidth={2} />;
    return <ShieldCheck size={24} color={iconColor} strokeWidth={2} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Star Hospital</Text>
          <Text style={styles.title}>Select Your Role</Text>
          <Text style={styles.subtitle}>
            Choose your designated portal to access tailored healthcare workflows and clinical tools.
          </Text>
        </View>

        {/* Role Cards List */}
        <View style={styles.cardsContainer}>
          {ROLES.map((item) => {
            const isSelected = selectedRole === item.role;
            return (
              <TouchableOpacity
                key={item.role}
                style={[styles.roleCard, isSelected && styles.roleCardActive]}
                onPress={() => setSelectedRole(item.role)}
                activeOpacity={0.88}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      isSelected ? styles.iconCircleActive : styles.iconCircleInactive,
                    ]}
                  >
                    {getRoleIcon(item.role, isSelected)}
                  </View>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={[styles.roleTitle, isSelected && styles.roleTitleActive]}>
                    {item.title}
                  </Text>
                  <Text style={styles.roleTagline}>{item.tagline}</Text>
                  <Text style={styles.roleDescription}>{item.description}</Text>
                </View>

                {/* Selection Checkmark */}
                <View style={styles.checkIndicatorRow}>
                  <View
                    style={[
                      styles.radioButton,
                      isSelected ? styles.radioButtonActive : styles.radioButtonInactive,
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={[styles.selectStatusText, isSelected && styles.selectStatusTextActive]}>
                    {isSelected ? 'Selected' : 'Tap to select'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Continue to Login"
          >
            <Text style={styles.continueButtonText}>Continue to Login</Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} style={styles.continueIcon} />
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0866C6',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  roleCardActive: {
    borderColor: '#0866C6',
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleInactive: {
    backgroundColor: '#EBF4FF',
  },
  iconCircleActive: {
    backgroundColor: '#0866C6',
  },
  badgePill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardBody: {
    marginBottom: 14,
  },
  roleTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 2,
  },
  roleTitleActive: {
    color: '#0866C6',
  },
  roleTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
  },
  checkIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioButtonInactive: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  radioButtonActive: {
    backgroundColor: '#0866C6',
  },
  selectStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  selectStatusTextActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  footer: {
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: '#0866C6',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  continueIcon: {
    marginLeft: 8,
  },
});

export default RoleSelectionScreen;
