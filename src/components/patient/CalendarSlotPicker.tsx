import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';

export interface CalendarSlotPickerProps {
  initialDate?: string; // e.g. "2026-11-15"
  initialSlot?: string; // e.g. "09:30 AM"
  onDateChange?: (date: string) => void;
  onSlotChange?: (slot: string) => void;
  availableSlots?: string[];
}

const DEFAULT_SLOTS = [
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarSlotPicker: React.FC<CalendarSlotPickerProps> = ({
  initialDate = '2026-11-15',
  initialSlot = '09:30 AM',
  onDateChange,
  onSlotChange,
  availableSlots = DEFAULT_SLOTS,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const parsed = parseInt(initialDate.split('-')[2], 10);
    return isNaN(parsed) ? 15 : parsed;
  });
  const [selectedSlot, setSelectedSlot] = useState<string>(initialSlot);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(10); // November (0-based)
  const currentYear = 2026;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Dynamically compute days in month and starting weekday for any selected month
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    const formatted = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (onDateChange) {
      onDateChange(formatted);
    }
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    if (onSlotChange) {
      onSlotChange(slot);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonthIndex > 0) {
      const nextMonthIdx = currentMonthIndex - 1;
      const maxDays = new Date(currentYear, nextMonthIdx + 1, 0).getDate();
      const clampedDay = Math.min(selectedDay, maxDays);
      setCurrentMonthIndex(nextMonthIdx);
      setSelectedDay(clampedDay);
      if (onDateChange) {
        onDateChange(
          `${currentYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
        );
      }
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex < 11) {
      const nextMonthIdx = currentMonthIndex + 1;
      const maxDays = new Date(currentYear, nextMonthIdx + 1, 0).getDate();
      const clampedDay = Math.min(selectedDay, maxDays);
      setCurrentMonthIndex(nextMonthIdx);
      setSelectedDay(clampedDay);
      if (onDateChange) {
        onDateChange(
          `${currentYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
        );
      }
    }
  };

  // Generate calendar grid cells (pad leading empty slots)
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  return (
    <View style={styles.container}>
      {/* Calendar Card */}
      <View style={styles.calendarCard}>
        {/* Month Navigation */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevMonth}
            accessibilityRole="button"
            accessibilityLabel="Previous Month"
          >
            <ChevronLeft size={20} color="#142D4E" />
          </TouchableOpacity>

          <Text style={styles.monthTitle}>
            {monthNames[currentMonthIndex]} {currentYear}
          </Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextMonth}
            accessibilityRole="button"
            accessibilityLabel="Next Month"
          >
            <ChevronRight size={20} color="#142D4E" />
          </TouchableOpacity>
        </View>

        {/* Days of Week Header */}
        <View style={styles.weekHeader}>
          {DAYS_OF_WEEK.map((day) => (
            <Text key={day} style={styles.weekDayText}>
              {day}
            </Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.daysGrid}>
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <View key={`empty-${idx}`} style={styles.emptyDayCell} />;
            }

            const isSelected = day === selectedDay;
            const isToday = day === 14;

            return (
              <TouchableOpacity
                key={`day-${day}`}
                style={[
                  styles.dayCell,
                  isSelected && styles.selectedDayCell,
                  isToday && !isSelected && styles.todayDayCell,
                ]}
                onPress={() => handleDaySelect(day)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${day} ${monthNames[currentMonthIndex]} ${currentYear}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.selectedDayText,
                    isToday && !isSelected && styles.todayDayText,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Available Slots Section */}
      <View style={styles.slotsSection}>
        <View style={styles.slotsHeaderRow}>
          <Clock size={16} color="#0866C6" />
          <Text style={styles.slotsHeaderTitle}>Available Slots</Text>
        </View>

        <View style={styles.slotsGrid}>
          {availableSlots.map((slot) => {
            const isSlotSelected = slot === selectedSlot;

            return (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.slotChip,
                  isSlotSelected && styles.selectedSlotChip,
                ]}
                onPress={() => handleSlotSelect(slot)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Time slot ${slot}`}
                accessibilityState={{ selected: isSlotSelected }}
              >
                <Text
                  style={[
                    styles.slotChipText,
                    isSlotSelected && styles.selectedSlotChipText,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
  },
  navButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    width: 36,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDayCell: {
    width: '14.28%',
    height: 40,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  selectedDayCell: {
    backgroundColor: '#0866C6',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  todayDayCell: {
    borderWidth: 1.5,
    borderColor: '#0866C6',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#142D4E',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDayText: {
    color: '#0866C6',
    fontWeight: '700',
  },
  slotsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  slotsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  slotsHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginLeft: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  slotChip: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSlotChip: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0866C6',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#142D4E',
  },
  selectedSlotChipText: {
    color: '#0866C6',
    fontWeight: '700',
  },
});

export default CalendarSlotPicker;
