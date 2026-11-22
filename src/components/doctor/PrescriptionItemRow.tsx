import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2, Pill, Clock, Calendar, AlertCircle } from 'lucide-react-native';
import { PrescriptionMedicineItem } from '@/types/prescription';

export interface PrescriptionItemRowProps {
  item: PrescriptionMedicineItem;
  index: number;
  onDelete: (index: number) => void;
  onEdit?: (index: number) => void;
}

export const PrescriptionItemRow: React.FC<PrescriptionItemRowProps> = ({
  item,
  index,
  onDelete,
  onEdit,
}) => {
  const getFrequencyBadgeColor = (freq: string) => {
    if (freq.includes('SOS')) {
      return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
    }
    if (freq.includes('1-1-1')) {
      return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
    }
    if (freq.includes('1-0-1')) {
      return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
    }
    return { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' };
  };

  const badgeStyle = getFrequencyBadgeColor(item.frequency || '');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.indexCircle}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>

        <View style={styles.titleContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.medicineName} numberOfLines={1}>
              {item.medicineName}
            </Text>
          </View>
          {item.genericName ? (
            <Text style={styles.genericName} numberOfLines={1}>
              {item.genericName}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => onDelete(index)}
          style={styles.deleteButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Remove ${item.medicineName}`}
        >
          <Trash2 size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsGrid}>
        {/* Dosage */}
        <View style={styles.detailPill}>
          <Pill size={12} color="#0866C6" />
          <Text style={styles.detailLabel}>Dosage:</Text>
          <Text style={styles.detailValue}>{item.dosage}</Text>
        </View>

        {/* Frequency */}
        <View
          style={[
            styles.frequencyPill,
            { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
          ]}
        >
          <Clock size={12} color={badgeStyle.text} />
          <Text style={[styles.frequencyText, { color: badgeStyle.text }]}>
            {item.frequency}
          </Text>
        </View>

        {/* Duration */}
        <View style={styles.detailPill}>
          <Calendar size={12} color="#0866C6" />
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{item.duration}</Text>
        </View>
      </View>

      {item.instructions ? (
        <View style={styles.instructionsRow}>
          <AlertCircle size={12} color="#64748B" />
          <Text style={styles.instructionsText} numberOfLines={2}>
            {item.instructions}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  indexText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0866C6',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
  },
  genericName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#142D4E',
  },
  frequencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  frequencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  instructionsText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    flex: 1,
  },
});
