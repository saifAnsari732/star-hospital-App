import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Calendar,
  FileText,
  Folder,
  Activity,
  CreditCard,
  Bed,
  Lock,
  LogOut,
  ChevronRight,
  User,
  ShieldCheck,
  ShieldAlert,
  FolderHeart,
  Receipt,
  HelpCircle,
  PhoneCall,
  Settings,
  Video,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patientService';
import { Patient } from '../../types/patient';
import { resolveEffectivePatientId } from './patientUtils';
import { TEMPLATE_IMAGES } from '../../assets/images';

export interface MyProfileScreenProps {
  navigation: any;
  route?: any;
}

export const MyProfileScreen: React.FC<MyProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);
  const [profile, setProfile] = useState<Patient | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      patientService
        .getProfile(effectivePatientId)
        .then((res) => {
          if (active && res) setProfile(res);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [effectivePatientId])
  );

  const fullName = user?.name || profile?.name || 'Rahul Sharma';
  const email = user?.email || profile?.email || 'rahul@gmail.com';
  const phone = user?.phone || profile?.phone || '+91 98765 43210';
  const mrn = profile?.mrn || effectivePatientId.toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  const menuItems = [
    {
      id: 'appointments',
      title: 'My Appointments',
      icon: <Calendar size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('AppointmentsTab'),
    },
    {
      id: 'prescriptions',
      title: 'My Prescriptions',
      icon: <FileText size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('PrescriptionsList'),
    },
    {
      id: 'reports',
      title: 'My Reports',
      icon: <Folder size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('ReportsTab'),
    },
    {
      id: 'edit-profile',
      title: 'My Profile',
      icon: <User size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: 'password',
      title: 'Change Password',
      icon: <Lock size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('ChangePassword'),
    },
    {
      id: 'video-consult',
      title: 'Video Consultation',
      icon: <Video size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('VideoConsultation'),
    },
    {
      id: 'history',
      title: 'Medical History',
      icon: <Activity size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('MedicalHistory'),
    },
    {
      id: 'allergies',
      title: 'Allergies',
      icon: <ShieldAlert size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('Allergies'),
    },
    {
      id: 'health-records',
      title: 'Health Records',
      icon: <FolderHeart size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('HealthRecords'),
    },
    {
      id: 'bills',
      title: 'My Bills & Razorpay',
      icon: <CreditCard size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('Bills'),
    },
    {
      id: 'payment-history',
      title: 'Payment History',
      icon: <Receipt size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('PaymentHistory'),
    },
    {
      id: 'admissions',
      title: 'Inpatient Admissions',
      icon: <Bed size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('Admissions'),
    },
    {
      id: 'help-support',
      title: 'Help & Support',
      icon: <HelpCircle size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('HelpSupport'),
    },
    {
      id: 'contact-hospital',
      title: 'Contact Hospital',
      icon: <PhoneCall size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('ContactHospital'),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings size={20} color="#0866C6" />,
      onPress: () => navigation.navigate('Settings'),
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <ChevronLeft size={24} color="#142D4E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Hero Portrait Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarRing}>
            <Image
              source={TEMPLATE_IMAGES.patientRahul}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          <Text style={styles.userPhone}>{phone}</Text>

          <View style={styles.mrnBadgeRow}>
            <ShieldCheck size={14} color="#0866C6" />
            <Text style={styles.mrnText}>MRN: {mrn}</Text>
          </View>
        </View>

        {/* Menu Navigation Items Card */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={item.onPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.menuIconContainer}>{item.icon}</View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
              {index < menuItems.length - 1 ? <View style={styles.menuDivider} /> : null}
            </React.Fragment>
          ))}
        </View>

        {/* Logout Destructive Card */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogout}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign out of account"
        >
          <View style={styles.logoutLeft}>
            <View style={styles.logoutIconContainer}>
              <LogOut size={20} color="#DC2626" />
            </View>
            <Text style={styles.logoutTitle}>Logout</Text>
          </View>
          <ChevronRight size={18} color="#DC2626" />
        </TouchableOpacity>

        <Text style={styles.versionFooter}>Star Hospital App • Version 1.0.0 (Expo SDK 58)</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142D4E',
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#BFDBFE',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 10,
  },
  mrnBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  mrnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#142D4E',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginLeft: 68,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 20,
  },
  logoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  modalInput: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#142D4E',
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MyProfileScreen;
