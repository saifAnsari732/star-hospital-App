import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Droplet, FileScan, Activity, Download, ChevronRight } from 'lucide-react-native';
import { DiagnosticReportItem } from '../../types/laboratory';

export interface ReportCardProps {
  report: DiagnosticReportItem;
  onPress?: () => void;
  onDownloadPress?: () => void;
  isDownloading?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onPress,
  onDownloadPress,
  isDownloading = false,
}) => {
  const getIconConfig = (testName: string, category: string) => {
    const lower = `${testName} ${category}`.toLowerCase();
    if (lower.includes('blood') || lower.includes('hematology') || lower.includes('cbc')) {
      return {
        bg: '#FEE2E2',
        color: '#DC2626',
        badgeText: 'LAB',
        icon: <Droplet size={20} color="#DC2626" fill="#DC2626" />,
      };
    }
    if (lower.includes('x-ray') || lower.includes('xray')) {
      return {
        bg: '#E0F2FE',
        color: '#0866C6',
        badgeText: null,
        icon: <FileScan size={22} color="#0866C6" />,
      };
    }
    return {
      bg: '#E0F2FE',
      color: '#0866C6',
      badgeText: null,
      icon: <Activity size={22} color="#0866C6" />,
    };
  };

  const iconConfig = getIconConfig(report.testName, report.category);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Report ${report.testName} dated ${report.date}`}
    >
      <View style={styles.contentRow}>
        <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
          {iconConfig.icon}
          {iconConfig.badgeText ? (
            <View style={styles.labTagBadge}>
              <Text style={styles.labTagText}>{iconConfig.badgeText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.reportTitle} numberOfLines={1}>
              {report.testName}
            </Text>
          </View>

          <Text style={styles.dateText}>{report.date}</Text>

          {report.doctorName ? (
            <Text style={styles.prescribedByText} numberOfLines={1}>
              Prescribed by {report.doctorName}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightActionCol}>
          <ChevronRight size={16} color="#94A3B8" style={styles.topArrow} />
          <TouchableOpacity
            style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
            onPress={onDownloadPress || onPress}
            activeOpacity={0.8}
            disabled={isDownloading}
            accessibilityRole="button"
            accessibilityLabel={`Download ${report.testName}`}
          >
            <Download size={13} color="#0866C6" style={styles.downloadIcon} />
            <Text style={styles.downloadText}>
              {isDownloading ? 'Saving...' : 'Download'}
            </Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  labTagBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
  },
  labTagText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  rightActionCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  topArrow: {
    marginRight: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginRight: 4,
    flexShrink: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  prescribedByText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#0866C6',
    backgroundColor: '#FFFFFF',
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadIcon: {
    marginRight: 4,
  },
  downloadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0866C6',
  },
});

export default ReportCard;
