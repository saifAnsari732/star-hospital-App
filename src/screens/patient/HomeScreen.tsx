import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu,
  Bell,
  Ticket,
  ChevronRight,
  Shield,
  HeartPulse,
  Users,
  Star,
  LogOut,
  Clock,
  Calendar,
  FileText,
  Pill,
} from 'lucide-react-native';
import { ImageBackground } from 'react-native';
import { QuickActionGrid } from '../../components/patient/QuickActionGrid';
import { AppointmentCard } from '../../components/patient/AppointmentCard';
import { useOPDToken } from '../../context/OPDTokenContext';
import { useAuth } from '../../context/AuthContext';
import { appointmentService, doctorService } from '../../services';
import { Appointment } from '../../types/appointment';
import { Doctor } from '../../types/doctor';
import { mockDoctors } from '../../fixtures/mockDoctors';
import { mockAppointments } from '../../fixtures/mockAppointments';
import { resolveEffectivePatientId } from './patientUtils';
import { TEMPLATE_IMAGES, getDoctorAvatarSource } from '../../assets/images';

export interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const isCompactViewport = viewportWidth > 0 && viewportWidth < 360;
  const isTabletViewport = viewportWidth >= 768;

  const { currentToken, refreshQueue } = useOPDToken();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(
    mockAppointments[0] || null
  );
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>(mockDoctors.slice(0, 6));

  const userName = user?.name || 'Rahul Sharma';
  const firstName = userName.split(' ')[0] || 'Rahul';

  const loadDashboardData = useCallback(async () => {
    try {
      const effectivePatientId = resolveEffectivePatientId(user?.id);
      const [apts, docs] = await Promise.all([
        appointmentService.getAppointments({
          patientId: effectivePatientId,
          status: 'upcoming',
        }),
        doctorService.getAllDoctors(),
      ]);
      setUpcomingAppointment(apts.length > 0 ? apts[0] : null);
      if (docs.length > 0) {
        setFeaturedDoctors(docs.slice(0, 6));
      }
    } catch {
      // Keep cached/fallback records if offline
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshQueue(), loadDashboardData()]);
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Top App Bar Header matching Reference Template Screen 6 */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Settings')}
            accessibilityRole="button"
            accessibilityLabel="Open Menu"
          >
            <Menu size={24} color="#142D4E" />
          </TouchableOpacity>

          <View style={styles.greetingContainer}>
            <Text style={styles.greetingTitle}>Hello, {firstName}!</Text>
            <Text style={styles.greetingSubtitle}>Welcome to Star Hospital</Text>
          </View>
        </View>

        <View style={styles.appBarRight}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityRole="button"
            accessibilityLabel="View Notifications"
          >
            <Bell size={20} color="#142D4E" />
            <View style={styles.notificationBadgeDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => void logout()}
            accessibilityRole="button"
            accessibilityLabel="Logout"
          >
            <LogOut size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0866C6']} />
        }
      >
        {/* Full Box Cover Hero Banner with Hospital Background */}
        <ImageBackground
          source={TEMPLATE_IMAGES.homeHeroBanner}
          style={styles.heroBanner}
          imageStyle={styles.heroBannerImage}
          resizeMode="cover"
        >
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerHeadline}>Your Health</Text>
            <Text style={styles.bannerHeadline}>Our Priority</Text>
            <Text style={styles.bannerSubtext}>Care Today... Healthier Tomorrow...</Text>
            <TouchableOpacity
              style={styles.bannerCta}
              onPress={() => navigation.navigate('FindDoctors')}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.bannerCtaText}>Find Doctors</Text>
              <ChevronRight size={14} color="#0866C6" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Value Proposition Badges */}
        <View style={styles.valuePropsRow}>
          <View style={styles.valuePropItem}>
            <View style={[styles.valuePropIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <HeartPulse size={15} color="#0866C6" />
            </View>
            <Text style={styles.valuePropLabel}>Easy Access</Text>
          </View>

          <View style={styles.valuePropItem}>
            <View style={[styles.valuePropIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Shield size={15} color="#16A34A" />
            </View>
            <Text style={styles.valuePropLabel}>Better Care</Text>
          </View>

          <View style={styles.valuePropItem}>
            <View style={[styles.valuePropIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Users size={15} color="#7C3AED" />
            </View>
            <Text style={styles.valuePropLabel}>Trusted Hospital</Text>
          </View>
        </View>

        {/* Live OPD Token Mini-Banner (if active) */}
        {currentToken ? (
          <TouchableOpacity
            style={styles.liveTokenBanner}
            onPress={() => navigation.navigate('OPDToken')}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            <View style={styles.tokenBannerLeft}>
              <View style={styles.tokenIconBadge}>
                <Ticket size={20} color="#0866C6" />
              </View>
              <View>
                <View style={styles.tokenNumberRow}>
                  <Text style={styles.tokenNumberText}>{currentToken.tokenNumber}</Text>
                  <View style={styles.liveIndicatorPill}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.liveIndicatorText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.tokenQueueMeta}>
                  Queue #{currentToken.queuePosition} • Est. ~{currentToken.estimatedWaitMinutes} mins
                </Text>
              </View>
            </View>

            <View style={styles.tokenBannerRight}>
              <Text style={styles.viewTokenLink}>View Queue</Text>
              <ChevronRight size={16} color="#0866C6" />
            </View>
          </TouchableOpacity>
        ) : null}

        {/* 2x2 Clean Action Grid matching Template Screen 6 */}
        <QuickActionGrid
          onBookAppointmentPress={() => navigation.navigate('BookAppointment')}
          onOPDTokenPress={() => navigation.navigate('OPDToken')}
          onMyAppointmentsPress={() => navigation.navigate('AppointmentsTab')}
          onReportsPress={() => navigation.navigate('ReportsTab')}
        />

        {/* Quick Access Section: 4 essential cards with proper spacing */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('FindDoctors')}
            accessibilityRole="button"
          >
            <Text style={styles.viewAllText}>View All &gt;</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickAccessRow}>
          {[
            {
              label: 'OPD Token',
              icon: Ticket,
              bg: '#E0F2FE',
              color: '#0866C6',
              onPress: () => navigation.navigate('OPDToken'),
            },
            {
              label: 'Queue Status',
              icon: Clock,
              bg: '#DCFCE7',
              color: '#16A34A',
              onPress: () => navigation.navigate('QueueStatus'),
            },
            {
              label: 'Prescriptions',
              icon: Pill,
              bg: '#EDE9FE',
              color: '#7C3AED',
              onPress: () => navigation.navigate('PrescriptionsList'),
            },
            {
              label: 'Find Doctors',
              icon: Users,
              bg: '#FEF3C7',
              color: '#D97706',
              onPress: () => navigation.navigate('FindDoctors'),
            },
          ].map((item) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                style={styles.quickAccessCard}
                onPress={item.onPress}
                activeOpacity={0.82}
              >
                <View style={[styles.quickAccessIconBox, { backgroundColor: item.bg }]}>
                  <IconComp size={22} color={item.color} />
                </View>
                <Text style={styles.quickAccessLabel} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Upcoming Appointment Card matching Template Screen 6 */}
        {upcomingAppointment ? (
          <View style={styles.appointmentSection}>
            <Text style={styles.subSectionTitle}>Upcoming Appointment</Text>
            <AppointmentCard
              appointment={upcomingAppointment}
              onPress={() =>
                navigation.navigate('AppointmentDetails', {
                  appointmentId: upcomingAppointment.id,
                })
              }
              showActions={false}
            />
          </View>
        ) : null}

        {/* Featured Doctors Section matching Template */}
        <View style={styles.featuredDoctorsSection}>
          <Text style={styles.subSectionTitle}>Specialist Doctors</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.docListScroll}>
            {featuredDoctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={styles.featuredDocCard}
                onPress={() => navigation.navigate('DoctorProfile', { doctorId: doctor.id, doctorName: doctor.name })}
                activeOpacity={0.85}
              >
                <View style={styles.docAvatarCircle}>
                  <Image
                    source={getDoctorAvatarSource(doctor.name || doctor.id)}
                    style={styles.docAvatarImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.docName} numberOfLines={1}>{doctor.name}</Text>
                <Text style={styles.docDept} numberOfLines={1}>{doctor.department}</Text>
                <View style={styles.docRatingRow}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.docRatingVal}>{doctor.rating.toFixed(1)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    marginRight: 10,
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D2342',
  },
  greetingSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 1,
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  heroBanner: {
    backgroundColor: '#0866C6',
    borderRadius: 20,
    minHeight: 145,
    justifyContent: 'center',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  heroBannerImage: {
    borderRadius: 20,
  },
  bannerTextCol: {
    maxWidth: '65%',
  },
  bannerHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  bannerSubtext: {
    fontSize: 11.5,
    color: '#E0F2FE',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  bannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bannerCtaText: {
    color: '#0866C6',
    fontSize: 12.5,
    fontWeight: '700',
    marginRight: 3,
  },
  valuePropsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  valuePropItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valuePropIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  valuePropLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#142D4E',
  },
  liveTokenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF4FF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: 10,
  },
  tokenBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tokenNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenNumberText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#064A91',
    marginRight: 6,
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  tokenQueueMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  tokenBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewTokenLink: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0866C6',
    marginRight: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0866C6',
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickAccessCard: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickAccessIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickAccessLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#142D4E',
    textAlign: 'center',
  },
  appointmentSection: {
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 8,
  },
  featuredDoctorsSection: {
    marginBottom: 10,
  },
  docListScroll: {
    paddingVertical: 4,
    gap: 12,
  },
  featuredDocCard: {
    width: 124,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
  },
  docAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  docName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#142D4E',
    textAlign: 'center',
  },
  docDept: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  docRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docRatingVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#142D4E',
    marginLeft: 4,
  },
});

export default HomeScreen;
