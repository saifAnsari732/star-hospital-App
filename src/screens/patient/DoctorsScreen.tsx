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

export interface DoctorsScreenProps {
  navigation: any;
  route?: {
    params?: {
      specialty?: string;
    };
  };
}

export const DoctorsScreen: React.FC<DoctorsScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const initialCategory = route?.params?.specialty || 'All';

  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>(initialCategory);

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

  const filterChips = ['All', 'General', 'Specialist', 'Other'];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'General') {
      return doc.department.toLowerCase().includes('general');
    }
    if (selectedFilter === 'Specialist') {
      return (
        doc.department.toLowerCase().includes('cardio') ||
        doc.department.toLowerCase().includes('ortho') ||
        doc.department.toLowerCase().includes('neuro') ||
        doc.department.toLowerCase().includes('pedia')
      );
    }
    // Other
    return (
      !doc.department.toLowerCase().includes('general') &&
      !doc.department.toLowerCase().includes('cardio') &&
      !doc.department.toLowerCase().includes('ortho')
    );
  });

  const handleSelectDoctor = (doctor: Doctor) => {
    navigation.navigate('DoctorProfile', {
      doctorId: doctor.id,
      doctorName: doctor.name,
    });
  };

  const handleBookDoctor = (doctor: Doctor) => {
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
        <Text style={styles.headerTitle}>Find Doctors</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputRow}>
          <Search size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Search doctor..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Filter Chips (Horizontal Row) */}
      <View style={styles.filterChipsRow}>
        {filterChips.map((chip) => {
          const isActive = selectedFilter === chip;
          return (
            <TouchableOpacity
              key={chip}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(chip)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${chip}`}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {chip}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Doctor Directory List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredDoctors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Doctors Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search criteria or filter tags.</Text>
          </View>
        ) : (
          filteredDoctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              variant="directory"
              showBookButton={false}
              onPress={() => handleSelectDoctor(doc)}
              onBookPress={() => handleBookDoctor(doc)}
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
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 12,
    gap: 8,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
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

export default DoctorsScreen;
