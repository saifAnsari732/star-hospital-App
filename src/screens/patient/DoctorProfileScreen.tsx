import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Star,
  Clock,
  MapPin,
  Award,
  Users,
  ShieldCheck,
  CalendarPlus,
  CalendarDays,
} from 'lucide-react-native';
import { doctorService } from '../../services';
import { Doctor, DoctorReview, DoctorScheduleSlot } from '../../types/doctor';
import { mockDoctors, mockDoctorSchedules, mockDoctorReviews } from '../../fixtures/mockDoctors';
import { getDoctorAvatarSource } from '../../assets/images';

export interface DoctorProfileScreenProps {
  navigation: any;
  route: {
    params?: {
      doctorId?: string;
      doctorName?: string;
    };
  };
}

export const DoctorProfileScreen: React.FC<DoctorProfileScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);

  const doctorId = route.params?.doctorId || 'doc-1';
  const fallbackDoctor = mockDoctors.find((d) => d.id === doctorId) || mockDoctors[0];
  const [doctor, setDoctor] = useState<Doctor>(fallbackDoctor);
  const [schedule, setSchedule] = useState<DoctorScheduleSlot[]>(mockDoctorSchedules);
  const [reviews, setReviews] = useState<DoctorReview[]>(
    mockDoctorReviews[doctorId] || mockDoctorReviews['doc-1'] || []
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      doctorService.getDoctorById(doctorId),
      doctorService.getDoctorSchedule(doctorId),
      doctorService.getDoctorReviews(doctorId),
    ])
      .then(([docData, scheduleData, reviewData]) => {
        if (!active) return;
        if (docData) setDoctor(docData);
        if (scheduleData && scheduleData.length > 0) setSchedule(scheduleData);
        if (reviewData && reviewData.length > 0) setReviews(reviewData);
      })
      .catch(() => {
        // Keep local fixture state
      });
    return () => {
      active = false;
    };
  }, [doctorId]);

  const handleBook = () => {
    navigation.navigate('SelectSlot', {
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: doctor.department,
    });
  };

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
        <Text style={styles.headerTitle}>Doctor Profile</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Doctor Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarOuterRing}>
            <Image
              source={getDoctorAvatarSource(doctor.name || doctor.id)}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.department}</Text>
          <Text style={styles.doctorQualification}>{doctor.qualification}</Text>

          <View style={styles.ratingBadge}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingNumber}>{doctor.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>
              ({doctor.reviewCount >= 1000 ? `${(doctor.reviewCount / 1000).toFixed(1)}k` : doctor.reviewCount} reviews)
            </Text>
          </View>

          {/* Stacked Action Buttons matching Reference UI Screen 14 */}
          <View style={styles.heroButtonsContainer}>
            <TouchableOpacity
              style={styles.heroBookBtn}
              onPress={handleBook}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Book Appointment"
            >
              <Text style={styles.heroBookBtnText}>Book Appointment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroViewProfileBtn}
              onPress={() => setShowAllReviews(!showAllReviews)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="View Profile Details"
            >
              <Text style={styles.heroViewProfileBtnText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row (3 Columns) */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <View style={styles.statIconCircle}>
              <Award size={18} color="#0866C6" />
            </View>
            <Text style={styles.statVal}>{doctor.experienceYears}+ Yrs</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <View style={styles.statIconCircle}>
              <Users size={18} color="#16A34A" />
            </View>
            <Text style={styles.statVal}>25,000+</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <View style={styles.statIconCircle}>
              <ShieldCheck size={18} color="#7C3AED" />
            </View>
            <Text style={styles.statVal}>₹{doctor.consultationFee}</Text>
            <Text style={styles.statLabel}>Fee</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeading}>About Doctor</Text>
          <Text style={styles.bioText}>
            {doctor.bio ||
              `${doctor.name} is a senior medical consultant at Star Hospital dedicated to clinical excellence and personalized patient care.`}
          </Text>
        </View>

        {/* Working Hours & Room */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeading}>Clinic Details</Text>

          <View style={styles.detailRow}>
            <Clock size={16} color="#0866C6" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Working Hours</Text>
              <Text style={styles.detailVal}>{doctor.workingHours || '09:00 AM - 02:00 PM'}</Text>
            </View>
          </View>

          <View style={styles.cardInnerDivider} />

          <View style={styles.detailRow}>
            <MapPin size={16} color="#0866C6" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>OPD Consultation Room</Text>
              <Text style={styles.detailVal}>{doctor.roomNo || 'OPD Room 101 (Ground Floor)'}</Text>
            </View>
          </View>
        </View>

        {/* Weekly OPD Availability Schedule */}
        <View style={styles.infoCard}>
          <View style={styles.availabilityHeaderRow}>
            <CalendarDays size={16} color="#0866C6" />
            <Text style={[styles.cardHeading, { marginBottom: 0, marginLeft: 8 }]}>
              Doctor Availability (Weekly OPD)
            </Text>
          </View>

          <View style={styles.scheduleList}>
            {schedule.map((slot) => (
              <View key={slot.dayOfWeek} style={styles.scheduleRowItem}>
                <Text style={styles.scheduleDayText}>{slot.dayName}</Text>
                {slot.isActive ? (
                  <View style={styles.scheduleActiveBadge}>
                    <Text style={styles.scheduleActiveText}>
                      {slot.startTime} - {slot.endTime}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.scheduleOffText}>OPD Closed</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Patient Reviews Section */}
        <View style={styles.infoCard}>
          <View style={styles.reviewsHeaderRow}>
            <Text style={styles.cardHeading}>Patient Reviews</Text>
            <TouchableOpacity onPress={() => setShowAllReviews(!showAllReviews)}>
              <Text style={styles.seeAllReviewsLink}>
                {showAllReviews ? 'Show Less' : 'View All'}
              </Text>
            </TouchableOpacity>
          </View>

          {(showAllReviews ? reviews : reviews.slice(0, 1)).map((rev) => (
            <View key={rev.id} style={styles.reviewItem}>
              <View style={styles.reviewUserRow}>
                <Text style={styles.reviewUserName}>{rev.patientName}</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={12}
                      color="#F59E0B"
                      fill={i <= Math.round(rev.rating) ? '#F59E0B' : 'transparent'}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewComment}>{rev.comment}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Buttons (Primary & Secondary) */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setShowAllReviews(!showAllReviews)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View Doctor Reviews"
          >
            <Text style={styles.secondaryBtnText}>View Reviews</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleBook}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Book Appointment"
          >
            <CalendarPlus size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.primaryBtnText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: 90,
  },
  heroSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  avatarOuterRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#BFDBFE',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 126,
    height: 126,
    borderRadius: 63,
  },
  avatarPlaceholder: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 16,
  },
  heroBookBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heroBookBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  heroViewProfileBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  heroViewProfileBtnText: {
    color: '#0D2342',
    fontSize: 15,
    fontWeight: '700',
  },
  doctorName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0866C6',
    marginBottom: 2,
  },
  doctorQualification: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 4,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#64748B',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 14,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTextCol: {
    marginLeft: 10,
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#142D4E',
    marginTop: 1,
  },
  cardInnerDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginVertical: 10,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllReviewsLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0866C6',
  },
  reviewItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  reviewUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 12,
    height: 48,
  },
  secondaryBtnText: {
    color: '#0866C6',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0866C6',
    borderRadius: 12,
    height: 48,
  },
  btnIcon: {
    marginRight: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  availabilityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scheduleList: {
    gap: 8,
  },
  scheduleRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scheduleDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#142D4E',
  },
  scheduleActiveBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scheduleActiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  scheduleOffText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
});

export default DoctorProfileScreen;
