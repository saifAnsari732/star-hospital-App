import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, Clock, Plus } from 'lucide-react-native';
import { LiveQueueStep } from '../../types/opdToken';

export interface LiveQueueStepperProps {
  steps?: LiveQueueStep[];
  currentTokenNumber?: string;
  servingTokenNumber?: string;
}

export const LiveQueueStepper: React.FC<LiveQueueStepperProps> = ({
  steps = [
    { tokenNumber: 'A-100', status: 'completed', label: 'Completed' },
    { tokenNumber: 'A-101', status: 'current', label: 'Serving' },
    { tokenNumber: 'A-102', status: 'waiting', label: 'Your Token' },
  ],
  currentTokenNumber = 'A-102',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isUserToken = step.tokenNumber === currentTokenNumber;

          return (
            <React.Fragment key={`step-${step.tokenNumber}-${index}`}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circleNode,
                    isCompleted && styles.completedNode,
                    isCurrent && styles.currentNode,
                    isUserToken && styles.userTokenNode,
                  ]}
                >
                  {isCompleted ? (
                    <Check size={18} color="#FFFFFF" strokeWidth={3} />
                  ) : isCurrent ? (
                    <Clock size={16} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <Plus size={18} color="#FFFFFF" strokeWidth={3} />
                  )}
                </View>

                <Text
                  style={[
                    styles.tokenLabel,
                    isUserToken && styles.activeTokenLabel,
                    isCurrent && styles.currentTokenLabel,
                  ]}
                  numberOfLines={1}
                >
                  {step.tokenNumber}
                </Text>

                <Text
                  style={[
                    styles.statusSubLabel,
                    isUserToken && styles.userStatusSubLabel,
                    isCurrent && styles.currentStatusSubLabel,
                  ]}
                  numberOfLines={1}
                >
                  {step.label || (isCompleted ? 'Done' : isCurrent ? 'Serving' : 'In Queue')}
                </Text>
              </View>

              {index < steps.length - 1 ? (
                <View
                  style={[
                    styles.connectorLine,
                    (isCompleted || isCurrent) && styles.connectorLineActive,
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    width: '100%',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    width: 76,
  },
  circleNode: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  completedNode: {
    backgroundColor: '#16A34A',
  },
  currentNode: {
    backgroundColor: '#16A34A',
    borderWidth: 3,
    borderColor: '#BBF7D0',
  },
  userTokenNode: {
    backgroundColor: '#0866C6',
    borderWidth: 3,
    borderColor: '#BFDBFE',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  userNodeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#142D4E',
    textAlign: 'center',
  },
  activeTokenLabel: {
    color: '#0866C6',
    fontWeight: '700',
  },
  currentTokenLabel: {
    color: '#16A34A',
    fontWeight: '700',
  },
  statusSubLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
    textAlign: 'center',
  },
  userStatusSubLabel: {
    color: '#0866C6',
    fontWeight: '600',
  },
  currentStatusSubLabel: {
    color: '#16A34A',
    fontWeight: '600',
  },
  connectorLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginBottom: 24,
    marginHorizontal: -4,
  },
  connectorLineActive: {
    backgroundColor: '#16A34A',
  },
});

export default LiveQueueStepper;
