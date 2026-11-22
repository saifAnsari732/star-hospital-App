import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, ChevronRight } from 'lucide-react-native';
import { Doctor } from '../../types/doctor';
import { getDoctorAvatarSource } from '../../assets/images';

export interface DoctorCardProps {
  doctor: Doctor;
  onPress?: () => void;
  onBookPress?: () => void;
  variant?: 'directory' | 'compact' | 'booking';
  showBookButton?: boolean;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onPress,
  onBookPress,
  variant = 'directory',
  showBookButton = true,
}) => {
  const avatarSource = getDoctorAvatarSource(doctor.name || doctor.id);

  // When card has internal Book button, outer container is a View to prevent HTML hydration error on Web:
  // "In HTML, <button> cannot be a descendant of <button>"
  const hasInteractiveBookButton = Boolean(showBookButton && onBookPress);

  const cardContent = (
    <View style={styles.headerRow}>
      <View style={styles.avatarContainer}>
        <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
      </View>

      <TouchableOpacity
        style={styles.infoContainer}
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`View profile of ${doctor.name}`}
      >
        <Text style={styles.doctorName} numberOfLines={1}>
          {doctor.name}
        </Text>
        <Text style={styles.departmentText} numberOfLines={1}>
          {doctor.department}
        </Text>

        {variant === 'booking' || showBookButton ? (
          <Text style={styles.expText}>
            Exp. {doctor.experienceYears || 10}+ years
          </Text>
        ) : (
          <View style={styles.metricsRow}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{doctor.rating.toFixed(1)}</Text>
          </View>
        )}
      </TouchableOpacity>

      {hasInteractiveBookButton ? (
        <TouchableOpacity
          style={styles.bookButton}
          onPress={onBookPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Book appointment with ${doctor.name}`}
        >
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      ) : (
        <ChevronRight size={20} color="#64748B" style={styles.chevron} />
      )}
    </View>
  );

  if (hasInteractiveBookButton) {
    return <View style={styles.card}>{cardContent}</View>;
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Doctor ${doctor.name}, ${doctor.department}`}
    >
      {cardContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF4FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  infoContainer: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D2342',
    marginBottom: 2,
  },
  departmentText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 5,
  },
  expText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#0866C6',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    marginLeft: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default DoctorCard;
