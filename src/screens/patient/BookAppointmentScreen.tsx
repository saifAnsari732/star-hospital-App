import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search } from 'lucide-react-native';
import { DoctorCard } from '../../components/patient/DoctorCard';
import { doctorService } from '../../services';
import { mockDoctors } from '../../fixtures/mockDoctors';
import { Doctor } from '../../types/doctor';

export interface BookAppointmentScreenProps {
  navigation: any;
  route?: any;
}

export const BookAppointmentScreen: React.FC<BookAppointmentScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      doctorService
        .getAllDoctors()
        .then((list) => {
          if (active && list.length > 0) {
            setDoctors(list);
          }
        })
        .catch(() => {
          // Retain fallback list
        });
      return () => {
        active = false;
      };
    }, [])
  );

  const categories = ['All', 'General Physician', 'Cardiologist', 'Orthopedic'];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || doc.department.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleSelectDoctor = (doctor: Doctor) => {
    navigation.navigate('SelectSlot', {
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: doctor.department,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <ChevronLeft size={24} color="#142D4E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* 3-Step Horizontal Progress Stepper */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperRow}>
          {/* Step 1 */}
          <View style={styles.stepNodeContainer}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={styles.stepNumberActive}>1</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Select Doctor</Text>
          </View>

          <View style={styles.stepConnector} />

          {/* Step 2 */}
          <View style={styles.stepNodeContainer}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Select Slot</Text>
          </View>

          <View style={styles.stepConnector} />

          {/* Step 3 */}
          <View style={styles.stepNodeContainer}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Confirm</Text>
          </View>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputRow}>
          <Search size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Search Doctor..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Specialty Filter Chips */}
      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Doctor Cards Listing */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredDoctors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Doctors Found</Text>
            <Text style={styles.emptySubtitle}>Try searching with a different name or speciality.</Text>
          </View>
        ) : (
          filteredDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              variant="booking"
              showBookButton={true}
              onPress={() => navigation.navigate('DoctorProfile', { doctorId: doc.id, doctorName: doc.name })}
              onBookPress={() => handleSelectDoctor(doc)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142D4E',
  },
  headerRightSpacer: {
    width: 36,
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNodeContainer: {
    alignItems: 'center',
    width: 80,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepCircleActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepNumberActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
    marginHorizontal: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#142D4E',
  },
  chipsRow: {
    marginVertical: 10,
  },
  chipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default BookAppointmentScreen;
