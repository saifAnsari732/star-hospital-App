import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { Appointment } from '../../types/appointment';
import { getDoctorAvatarSource } from '../../assets/images';

export interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
  onCancelPress?: () => void;
  onReschedulePress?: () => void;
  showActions?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onPress,
  onCancelPress,
  onReschedulePress,
  showActions = false,
}) => {
  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
      case 'arrived':
        return {
          bg: '#ECFDF5',
          border: '#86EFAC',
          text: '#16A34A',
          label: 'Confirmed',
        };
      case 'completed':
        return {
          bg: '#E0F2FE',
          border: '#93C5FD',
          text: '#0866C6',
          label: 'Completed',
        };
      case 'cancelled':
      case 'no show':
        return {
          bg: '#FEE2E2',
          border: '#FCA5A5',
          text: '#DC2626',
          label: 'Cancelled',
        };
      case 'in consultation':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          text: '#D97706',
          label: 'In Consultation',
        };
      default:
        return {
          bg: '#F1F5F9',
          border: '#CBD5E1',
          text: '#64748B',
          label: status,
        };
    }
  };

  const statusConfig = getStatusBadge(appointment.status);
  const avatarSource = getDoctorAvatarSource(appointment.doctorName || appointment.doctorId);
  const hasInteractiveActions = Boolean(showActions && appointment.status === 'scheduled');

  const cardContent = (
    <>
      <TouchableOpacity
        style={styles.mainRow}
        activeOpacity={onPress ? 0.8 : 1}
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`Appointment with ${appointment.doctorName} on ${appointment.date} at ${appointment.timeSlot}`}
      >
        <Image source={avatarSource} style={styles.doctorAvatar} resizeMode="cover" />

        <View style={styles.contentColumn}>
          <Text style={styles.doctorName} numberOfLines={1}>
            {appointment.doctorName}
          </Text>
          <Text style={styles.departmentText} numberOfLines={1}>
            {appointment.doctorDepartment}
          </Text>

          <View style={styles.metaItem}>
            <Calendar size={14} color="#475569" />
            <Text style={styles.metaText}>{appointment.date}</Text>
          </View>

          <View style={styles.bottomStatusRow}>
            <View style={styles.metaItem}>
              <Clock size={14} color="#475569" />
              <Text style={styles.metaText}>{appointment.timeSlot}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bg, borderColor: statusConfig.border },
              ]}
            >
              <Text style={[styles.statusText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {hasInteractiveActions ? (
        <View style={styles.actionsRow}>
          {onCancelPress ? (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancelPress}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}

          {onReschedulePress ? (
            <TouchableOpacity
              style={styles.rescheduleBtn}
              onPress={onReschedulePress}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.rescheduleBtnText}>Reschedule</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </>
  );

  return <View style={styles.card}>{cardContent}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBF4FF',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    marginRight: 14,
  },
  contentColumn: {
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
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 6,
  },
  bottomStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  rescheduleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EBF4FF',
  },
  rescheduleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0866C6',
  },
});

export default AppointmentCard;
