import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity, Heart, Thermometer, Scale, Wind } from 'lucide-react-native';

export interface VitalsData {
  bp?: string; // Blood Pressure e.g. "120/80"
  pulse?: string; // Pulse e.g. "72" or "72 bpm"
  temp?: string; // Temperature e.g. "98.6" or "98.6 °F"
  weight?: string; // Weight e.g. "68 kg"
  spO2?: string; // Oxygen e.g. "98%"
}

export interface VitalsSummaryBadgeProps {
  vitals?: VitalsData;
  bp?: string;
  pulse?: string;
  temp?: string;
  weight?: string;
  spO2?: string;
  compact?: boolean;
}

export const VitalsSummaryBadge: React.FC<VitalsSummaryBadgeProps> = ({
  vitals,
  bp: propBp,
  pulse: propPulse,
  temp: propTemp,
  weight: propWeight,
  spO2: propSpO2,
  compact = false,
}) => {
  const finalBp = vitals?.bp || propBp;
  const finalPulse = vitals?.pulse || propPulse;
  const finalTemp = vitals?.temp || propTemp;
  const finalWeight = vitals?.weight || propWeight;
  const finalSpO2 = vitals?.spO2 || propSpO2;

  if (!finalBp && !finalPulse && !finalTemp && !finalWeight && !finalSpO2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No vitals recorded</Text>
      </View>
    );
  }

  // Basic clinical check for abnormal highlights
  const isBpHigh = finalBp ? parseInt(finalBp.split('/')[0] || '120', 10) >= 140 : false;
  const isTempHigh = finalTemp ? parseFloat(finalTemp.replace(/[^0-9.]/g, '')) >= 100.4 : false;
  const isSpO2Low = finalSpO2 ? parseInt(finalSpO2.replace(/[^0-9]/g, ''), 10) < 95 : false;

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Blood Pressure */}
      {finalBp ? (
        <View
          style={[
            styles.chip,
            isBpHigh ? styles.warningChip : styles.normalChip,
          ]}
        >
          <Activity size={12} color={isBpHigh ? '#DC2626' : '#0866C6'} />
          <Text style={styles.label}>BP:</Text>
          <Text
            style={[
              styles.value,
              isBpHigh && styles.warningValue,
            ]}
          >
            {finalBp}
          </Text>
        </View>
      ) : null}

      {/* Pulse / Heart Rate */}
      {finalPulse ? (
        <View style={[styles.chip, styles.normalChip]}>
          <Heart size={12} color="#E11D48" />
          <Text style={styles.label}>HR:</Text>
          <Text style={styles.value}>
            {finalPulse.includes('bpm') ? finalPulse : `${finalPulse} bpm`}
          </Text>
        </View>
      ) : null}

      {/* Temperature */}
      {finalTemp ? (
        <View
          style={[
            styles.chip,
            isTempHigh ? styles.warningChip : styles.normalChip,
          ]}
        >
          <Thermometer size={12} color={isTempHigh ? '#D97706' : '#0D9488'} />
          <Text style={styles.label}>Temp:</Text>
          <Text
            style={[
              styles.value,
              isTempHigh && styles.warningValue,
            ]}
          >
            {finalTemp.includes('°') ? finalTemp : `${finalTemp}°F`}
          </Text>
        </View>
      ) : null}

      {/* SpO2 */}
      {finalSpO2 ? (
        <View
          style={[
            styles.chip,
            isSpO2Low ? styles.warningChip : styles.normalChip,
          ]}
        >
          <Wind size={12} color={isSpO2Low ? '#DC2626' : '#2563EB'} />
          <Text style={styles.label}>SpO2:</Text>
          <Text
            style={[
              styles.value,
              isSpO2Low && styles.warningValue,
            ]}
          >
            {finalSpO2.includes('%') ? finalSpO2 : `${finalSpO2}%`}
          </Text>
        </View>
      ) : null}

      {/* Weight */}
      {finalWeight && !compact ? (
        <View style={[styles.chip, styles.normalChip]}>
          <Scale size={12} color="#64748B" />
          <Text style={styles.label}>Wt:</Text>
          <Text style={styles.value}>
            {finalWeight.includes('kg') ? finalWeight : `${finalWeight} kg`}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  compactContainer: {
    gap: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  normalChip: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  warningChip: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  value: {
    fontSize: 11,
    fontWeight: '700',
    color: '#142D4E',
  },
  warningValue: {
    color: '#DC2626',
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
