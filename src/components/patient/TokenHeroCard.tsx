import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Share2, MapPin, Stethoscope } from 'lucide-react-native';
import { OPDToken } from '../../types/opdToken';

export interface TokenHeroCardProps {
  token: OPDToken;
  onViewQueuePress?: () => void;
  onSharePress?: () => void;
  showActions?: boolean;
}

export const TokenHeroCard: React.FC<TokenHeroCardProps> = ({
  token,
  onViewQueuePress,
  onSharePress,
  showActions = true,
}) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.cardContainer}>
        <View style={styles.heroTopBanner}>
          <Text style={styles.topLabel}>Your Token Number</Text>
          <Text style={styles.tokenDisplay}>{token.tokenNumber}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.queueRow}>
            <Text style={styles.queueLabel}>Queue No. : </Text>
            <Text style={styles.metricHighlight}>{token.queuePosition}</Text>
          </View>

          <View style={styles.horizontalDivider} />

          <View style={styles.estimatedSection}>
            <Text style={styles.estimatedLabel}>Estimated Time</Text>
            <Text style={styles.estimatedValue}>~ {token.estimatedWaitMinutes} mins</Text>
          </View>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Stethoscope size={15} color="#0866C6" />
              <Text style={styles.infoDoctorName}>{token.doctorName}</Text>
              <Text style={styles.infoDept}>• {token.department}</Text>
            </View>

            {token.roomNo ? (
              <View style={styles.infoRow}>
                <MapPin size={15} color="#64748B" />
                <Text style={styles.infoRoom}>{token.roomNo}</Text>
              </View>
            ) : null}
          </View>

          {showActions ? (
            <View style={styles.actionButtonsContainer}>
              {onViewQueuePress ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onViewQueuePress}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="View Live Queue Status"
                >
                  <Text style={styles.primaryButtonText}>View Queue</Text>
                </TouchableOpacity>
              ) : null}

              {onSharePress ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onSharePress}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Share Token Details"
                >
                  <Share2 size={16} color="#0866C6" style={styles.shareIcon} />
                  <Text style={styles.secondaryButtonText}>Share Token</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: 10,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopBanner: {
    backgroundColor: '#DCEBFA',
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  topLabel: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
    marginBottom: 6,
  },
  tokenDisplay: {
    fontSize: 44,
    fontWeight: '900',
    color: '#0D2342',
    letterSpacing: 1.5,
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  queueLabel: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  metricHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D2342',
  },
  horizontalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  estimatedSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  estimatedLabel: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 4,
  },
  estimatedValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D2342',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  infoDoctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    marginLeft: 6,
  },
  infoDept: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  infoRoom: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
  },
  actionButtonsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#0866C6',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  shareIcon: {
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#0D2342',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default TokenHeroCard;
