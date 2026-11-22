import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, Pill } from 'lucide-react-native';
import { Prescription } from '../../types/prescription';

export interface PrescriptionCardProps {
  prescription: Prescription;
  onPress?: () => void;
  onViewPress?: () => void;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  onPress,
  onViewPress,
}) => {
  const medicineCount = prescription.items?.length || 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress || onViewPress}
      accessibilityRole="button"
      accessibilityLabel={`Prescription by ${prescription.doctorName} dated ${prescription.date}`}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <FileText size={22} color="#0866C6" />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.doctorName} numberOfLines={1}>
            {prescription.doctorName}
          </Text>
          <Text style={styles.departmentText} numberOfLines={1}>
            {prescription.doctorDepartment}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.dateText}>{prescription.date}</Text>
            {medicineCount > 0 ? (
              <View style={styles.medicinePill}>
                <Pill size={11} color="#0866C6" />
                <Text style={styles.medicineCountText}>
                  {medicineCount} {medicineCount === 1 ? 'medicine' : 'medicines'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewButton}
          onPress={onViewPress || onPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`View prescription from ${prescription.doctorName}`}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailsContainer: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 2,
  },
  departmentText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 8,
  },
  medicinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  medicineCountText: {
    fontSize: 11,
    color: '#0866C6',
    fontWeight: '500',
    marginLeft: 3,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#0866C6',
    backgroundColor: '#FFFFFF',
    marginLeft: 8,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0866C6',
  },
});

export default PrescriptionCard;
