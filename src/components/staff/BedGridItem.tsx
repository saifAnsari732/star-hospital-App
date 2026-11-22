import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Bed, User, Clock, Stethoscope, AlertCircle, Check } from 'lucide-react-native';
import { HospitalBed, BedStatus } from '../../types/bed';

export interface BedGridItemProps {
  bed: HospitalBed;
  onAdmit?: (bed: HospitalBed) => void;
  onDischarge?: (bed: HospitalBed) => void;
  onPress?: (bed: HospitalBed) => void;
  style?: StyleProp<ViewStyle>;
}

const STATUS_CONFIG: Record<
  BedStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    cardBorder: string;
  }
> = {
  available: {
    label: 'Available',
    bgColor: '#DCFCE7',
    textColor: '#15803D',
    borderColor: '#BBF7D0',
    cardBorder: '#86EFAC',
  },
  occupied: {
    label: 'Occupied',
    bgColor: '#EFF6FF',
    textColor: '#1D4ED8',
    borderColor: '#BFDBFE',
    cardBorder: '#93C5FD',
  },
  maintenance: {
    label: 'Maintenance',
    bgColor: '#FEF3C7',
    textColor: '#B45309',
    borderColor: '#FDE68A',
    cardBorder: '#FCD34D',
  },
  reserved: {
    label: 'Reserved',
    bgColor: '#EDE9FE',
    textColor: '#6D28D9',
    borderColor: '#DDD6FE',
    cardBorder: '#C4B5FD',
  },
};

export const BedGridItem: React.FC<BedGridItemProps> = ({
  bed,
  onAdmit,
  onDischarge,
  onPress,
  style,
}) => {
  const statusConfig = STATUS_CONFIG[bed.status] || STATUS_CONFIG.available;
  const isOccupied = bed.status === 'occupied' && !!bed.currentPatient;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={() => onPress?.(bed)}
      disabled={!onPress}
      style={[
        styles.card,
        { borderLeftColor: statusConfig.cardBorder },
        style,
      ]}
    >
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.bedIdentRow}>
          <View
            style={[
              styles.bedIconWrap,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Bed size={18} color={statusConfig.textColor} strokeWidth={2.4} />
          </View>
          <View>
            <Text style={styles.bedNumber}>{bed.bedNumber}</Text>
            <Text style={styles.roomText}>
              {bed.roomNumber} • {bed.floor}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusConfig.bgColor,
              borderColor: statusConfig.borderColor,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Ward & Category Bar */}
      <View style={styles.metaRow}>
        <Text style={styles.wardTag}>{bed.wardName}</Text>
        <Text style={styles.categoryPill}>{bed.category}</Text>
        <Text style={styles.rateText}>Rs. {bed.dailyRate.toLocaleString()}/day</Text>
      </View>

      {/* Patient info if Occupied */}
      {isOccupied && bed.currentPatient ? (
        <View style={styles.patientBox}>
          <View style={styles.patientRow}>
            <User size={14} color="#0866C6" strokeWidth={2.2} />
            <Text style={styles.patientName} numberOfLines={1}>
              {bed.currentPatient.patientName}
            </Text>
            <Text style={styles.mrnTag}>({bed.currentPatient.mrn})</Text>
          </View>

          {bed.currentPatient.doctorName && (
            <View style={styles.doctorRow}>
              <Stethoscope size={13} color="#64748B" />
              <Text style={styles.doctorName}>
                {bed.currentPatient.doctorName.startsWith('Dr.')
                  ? bed.currentPatient.doctorName
                  : `Dr. ${bed.currentPatient.doctorName}`}
              </Text>
            </View>
          )}

          {bed.currentPatient.admittedAt && (
            <View style={styles.timeRow}>
              <Clock size={12} color="#94A3B8" />
              <Text style={styles.admittedTime}>
                Admitted: {bed.currentPatient.admittedAt}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.emptyBedState}>
          <Text style={styles.emptyBedText}>
            {bed.status === 'maintenance'
              ? 'Under housekeeping / maintenance'
              : 'Bed sanitized & ready for admission'}
          </Text>
        </View>
      )}

      {/* Action CTA Buttons */}
      <View style={styles.actionRow}>
        {bed.status === 'available' && onAdmit && (
          <TouchableOpacity
            style={styles.admitButton}
            onPress={() => onAdmit(bed)}
          >
            <Check size={14} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={styles.admitButtonText}>Admit Patient</Text>
          </TouchableOpacity>
        )}

        {bed.status === 'occupied' && onDischarge && (
          <TouchableOpacity
            style={styles.dischargeButton}
            onPress={() => onDischarge(bed)}
          >
            <Text style={styles.dischargeButtonText}>Discharge</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 5,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bedIdentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bedNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
  },
  roomText: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  wardTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPill: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0866C6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
    marginLeft: 'auto',
  },
  patientBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    flexShrink: 1,
  },
  mrnTag: {
    fontSize: 11,
    color: '#64748B',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 12,
    color: '#475569',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  admittedTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  emptyBedState: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  emptyBedText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  admitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  admitButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dischargeButton: {
    borderWidth: 1.5,
    borderColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dischargeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
});
