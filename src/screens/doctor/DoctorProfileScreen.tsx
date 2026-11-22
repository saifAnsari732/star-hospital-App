import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Award,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Bell,
  LogOut,
  Star,
  Calendar,
  Settings,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import type { Doctor } from '../../types/doctor';
import { getDoctorAvatarSource } from '../../assets/images';

export const DoctorProfileScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [onlineConsultAvailable, setOnlineConsultAvailable] = useState(true);
  const [opdAccepting, setOpdAccepting] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  useEffect(() => {
    doctorService
      .getDoctorById('doc-1')
      .then((d) => setDoctor(d))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Sign out from the Star Hospital Doctor Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Doctor Profile</Text>
        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={() => navigation?.navigate?.('DoctorSettings')}
        >
          <Settings size={20} color="#0866C6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Identity Hero */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarCircle}>
            <Image
              source={getDoctorAvatarSource(user?.name || doctor?.name || doctor?.id)}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.doctorName}>
                {user?.name || doctor?.name || 'Dr. Amit Sharma'}
              </Text>
              <ShieldCheck size={17} color="#0866C6" />
            </View>
            <Text style={styles.specialization}>
              {doctor?.department || 'General Physician'}
            </Text>
            <Text style={styles.qualifications}>
              {doctor?.qualification || 'MBBS, MD - Internal Medicine'}
            </Text>
            <View style={styles.licenseRow}>
              <Award size={13} color="#0866C6" />
              <Text style={styles.licenseText}>
                Reg # PMDC-88412 | {doctor?.experienceYears || 14}+ Years Exp
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <View style={styles.statValueRow}>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.statValue}>{doctor?.rating || 4.8}</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statValue}>{doctor?.reviewCount || 1250}</Text>
            <Text style={styles.statLabel}>Consults</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statValue, { color: '#0866C6' }]}>
              Rs. {doctor?.consultationFee || 1500}
            </Text>
            <Text style={styles.statLabel}>OPD Fee</Text>
          </View>
        </View>

        {/* Shortcuts */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Workspace &amp; Account</Text>
          <TouchableOpacity
            style={styles.navLinkRow}
            onPress={() => navigation?.navigate?.('ScheduleTab')}
          >
            <Calendar size={17} color="#0866C6" />
            <Text style={styles.navLinkText}>My OPD Schedule &amp; Calendar</Text>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.navLinkRow}
            onPress={() => navigation?.navigate?.('DoctorNotifications')}
          >
            <Bell size={17} color="#0866C6" />
            <Text style={styles.navLinkText}>Clinical Notifications</Text>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.navLinkRow}
            onPress={() => navigation?.navigate?.('DoctorSettings')}
          >
            <Settings size={17} color="#0866C6" />
            <Text style={styles.navLinkText}>Doctor Settings &amp; Security</Text>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Chamber Contact */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Chamber Information</Text>
          <View style={styles.infoRow}>
            <Phone size={15} color="#0866C6" />
            <Text style={styles.infoValue}>
              {user?.phone || doctor?.phone || '+92 300 5550101'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Mail size={15} color="#0866C6" />
            <Text style={styles.infoValue}>
              {user?.email || doctor?.email || 'amit.sharma@starhospital.com'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={15} color="#0866C6" />
            <Text style={styles.infoValue}>
              {doctor?.roomNo || 'OPD Room 101'}, Star Hospital Main Wing
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={15} color="#0866C6" />
            <Text style={styles.infoValue}>
              {doctor?.workingHours || 'Mon - Sat | 09:00 AM - 05:00 PM'}
            </Text>
          </View>
        </View>

        {/* Quick Toggles */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Live Availability Controls</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Accepting OPD Walk-Ins</Text>
              <Text style={styles.toggleSub}>
                Show available slots on Receptionist Token Desk
              </Text>
            </View>
            <Switch
              value={opdAccepting}
              onValueChange={setOpdAccepting}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={opdAccepting ? '#0866C6' : '#64748B'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Telemedicine Video OPD</Text>
              <Text style={styles.toggleSub}>
                Enable online video consultation bookings
              </Text>
            </View>
            <Switch
              value={onlineConsultAvailable}
              onValueChange={setOnlineConsultAvailable}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={onlineConsultAvailable ? '#0866C6' : '#64748B'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Clinical Push Alerts</Text>
              <Text style={styles.toggleSub}>
                Urgent lab values and checked-in patient pings
              </Text>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={pushNotifs ? '#0866C6' : '#64748B'}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0866C6',
  },
  heroInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142D4E',
  },
  specialization: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0866C6',
    marginTop: 2,
  },
  qualifications: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  licenseText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 10,
  },
  navLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  navLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#142D4E',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  infoValue: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default DoctorProfileScreen;
