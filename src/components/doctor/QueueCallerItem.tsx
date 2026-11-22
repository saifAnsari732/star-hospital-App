import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Volume2, Clock, CheckCircle, ChevronRight, AlertCircle, FileText } from 'lucide-react-native';

export interface QueuePatientData {
  id: string;
  tokenNumber: string;
  patientId?: string;
  patientName: string;
  patientMrn?: string;
  age?: string | number;
  gender?: string;
  department?: string;
  arrivedAt?: string;
  waitTimeMinutes?: number;
  status: 'arrived' | 'in_consultation' | 'completed' | 'cancelled' | 'scheduled';
  chiefComplaint?: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
  };
}

export interface QueueCallerItemProps {
  item: QueuePatientData;
  isCurrentlyServing?: boolean;
  onCallPatient?: (item: QueuePatientData) => void;
  onCompletePatient?: (item: QueuePatientData) => void;
  onOpenNotes?: (item: QueuePatientData) => void;
  onSelect?: (item: QueuePatientData) => void;
}

export const QueueCallerItem: React.FC<QueueCallerItemProps> = ({
  item,
  isCurrentlyServing = false,
  onCallPatient,
  onCompletePatient,
  onOpenNotes,
  onSelect,
}) => {
  const getStatusBadge = () => {
    switch (item.status) {
      case 'in_consultation':
        return {
          label: 'In Consultation',
          bg: '#EDE9FE',
          text: '#7C3AED',
          border: '#DDD6FE',
        };
      case 'completed':
        return {
          label: 'Completed',
          bg: '#DCFCE7',
          text: '#15803D',
          border: '#BBF7D0',
        };
      case 'arrived':
        return {
          label: 'Waiting',
          bg: '#FEF3C7',
          text: '#B45309',
          border: '#FDE68A',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          bg: '#FEE2E2',
          text: '#B91C1C',
          border: '#FECACA',
        };
      default:
        return {
          label: 'Scheduled',
          bg: '#F1F5F9',
          text: '#475569',
          border: '#E2E8F0',
        };
    }
  };

  const statusStyle = getStatusBadge();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect?.(item)}
      style={[
        styles.container,
        isCurrentlyServing && styles.servingContainer,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenText}>{item.tokenNumber}</Text>
        </View>

        <View style={styles.patientInfo}>
          <Text style={styles.patientName} numberOfLines={1}>
            {item.patientName}
          </Text>
          <View style={styles.metaRow}>
            {item.patientMrn ? (
              <Text style={styles.metaText}>{item.patientMrn}</Text>
            ) : null}
            {item.age || item.gender ? (
              <Text style={styles.metaText}>
                {item.age ? `${item.age} yrs` : ''}
                {item.age && item.gender ? ' • ' : ''}
                {item.gender || ''}
              </Text>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
          ]}
        >
          <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      {item.chiefComplaint ? (
        <View style={styles.complaintBox}>
          <AlertCircle size={13} color="#64748B" style={styles.complaintIcon} />
          <Text style={styles.complaintText} numberOfLines={1}>
            {item.chiefComplaint}
          </Text>
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <View style={styles.waitInfo}>
          <Clock size={13} color="#64748B" />
          <Text style={styles.waitText}>
            {item.waitTimeMinutes !== undefined
              ? `Wait: ~${item.waitTimeMinutes} mins`
              : item.arrivedAt
              ? `Arrived: ${item.arrivedAt}`
              : 'Waiting in queue'}
          </Text>
        </View>

        <View style={styles.actionsGroup}>
          {item.status === 'in_consultation' ? (
            <>
              {onOpenNotes && (
                <TouchableOpacity
                  style={styles.notesButton}
                  onPress={() => onOpenNotes(item)}
                >
                  <FileText size={14} color="#0866C6" />
                  <Text style={styles.notesButtonText}>Notes</Text>
                </TouchableOpacity>
              )}
              {onCompletePatient && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => onCompletePatient(item)}
                >
                  <CheckCircle size={14} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </>
          ) : item.status === 'arrived' ? (
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => onCallPatient?.(item)}
            >
              <Volume2 size={14} color="#FFFFFF" />
              <Text style={styles.callButtonText}>Call In</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => onSelect?.(item)}
            >
              <Text style={styles.viewButtonText}>View</Text>
              <ChevronRight size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  servingContainer: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenBadge: {
    backgroundColor: '#0866C6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 12,
  },
  tokenText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  patientInfo: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  complaintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  complaintIcon: {
    marginRight: 6,
  },
  complaintText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  waitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  waitText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    backgroundColor: '#0866C6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  notesButton: {
    backgroundColor: '#E0F2FE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  notesButtonText: {
    color: '#0866C6',
    fontSize: 12,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
