import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarPlus, Ticket, CalendarCheck, FileText } from 'lucide-react-native';

export interface QuickActionGridProps {
  onBookAppointmentPress: () => void;
  onOPDTokenPress: () => void;
  onMyAppointmentsPress: () => void;
  onReportsPress: () => void;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  onBookAppointmentPress,
  onOPDTokenPress,
  onMyAppointmentsPress,
  onReportsPress,
}) => {
  const actions = [
    {
      id: 'book',
      label: 'Book\nAppointment',
      icon: <CalendarPlus size={26} color="#0866C6" strokeWidth={2.2} />,
      onPress: onBookAppointmentPress,
      accessibilityLabel: 'Book Appointment',
    },
    {
      id: 'token',
      label: 'OPD Token',
      icon: <Ticket size={26} color="#0866C6" strokeWidth={2.2} />,
      onPress: onOPDTokenPress,
      accessibilityLabel: 'OPD Token',
    },
    {
      id: 'appointments',
      label: 'My\nAppointments',
      icon: <CalendarCheck size={26} color="#0866C6" strokeWidth={2.2} />,
      onPress: onMyAppointmentsPress,
      accessibilityLabel: 'My Appointments',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText size={26} color="#0866C6" strokeWidth={2.2} />,
      onPress: onReportsPress,
      accessibilityLabel: 'Medical Reports',
    },
  ];

  return (
    <View style={styles.gridContainer}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.actionCard}
          onPress={action.onPress}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
        >
          <View style={styles.iconCircle}>{action.icon}</View>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default QuickActionGrid;
