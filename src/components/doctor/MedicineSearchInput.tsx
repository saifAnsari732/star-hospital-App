import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Search, X, Pill, Plus } from 'lucide-react-native';

export interface MedicineSuggestion {
  id: string;
  name: string;
  genericName: string;
  category: string;
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Drops' | 'Ointment' | 'Inhaler';
  defaultDosage: string;
  defaultFrequency: string;
  defaultDuration: string;
}

export const COMMON_HOSPITAL_MEDICINES: MedicineSuggestion[] = [
  {
    id: 'med-1',
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotic',
    form: 'Capsule',
    defaultDosage: '500mg',
    defaultFrequency: '1-0-1',
    defaultDuration: '5 days',
  },
  {
    id: 'med-2',
    name: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    category: 'Analgesic & Antipyretic',
    form: 'Tablet',
    defaultDosage: '500mg',
    defaultFrequency: '1-0-1',
    defaultDuration: '3 days',
  },
  {
    id: 'med-3',
    name: 'Augmentin 625mg',
    genericName: 'Co-amoxiclav (Amoxicillin + Clavulanic Acid)',
    category: 'Antibiotic',
    form: 'Tablet',
    defaultDosage: '625mg',
    defaultFrequency: '1-0-1',
    defaultDuration: '5 days',
  },
  {
    id: 'med-4',
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole Magnesium',
    category: 'Antacid / PPI',
    form: 'Capsule',
    defaultDosage: '20mg',
    defaultFrequency: '1-0-0',
    defaultDuration: '14 days',
  },
  {
    id: 'med-5',
    name: 'Ibuprofen 400mg',
    genericName: 'Ibuprofen',
    category: 'NSAID / Pain Relief',
    form: 'Tablet',
    defaultDosage: '400mg',
    defaultFrequency: 'SOS',
    defaultDuration: '3 days',
  },
  {
    id: 'med-6',
    name: 'Azithromycin 500mg',
    genericName: 'Azithromycin Dihydrate',
    category: 'Macrolide Antibiotic',
    form: 'Tablet',
    defaultDosage: '500mg',
    defaultFrequency: '1-0-0',
    defaultDuration: '3 days',
  },
  {
    id: 'med-7',
    name: 'Metformin 500mg',
    genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic',
    form: 'Tablet',
    defaultDosage: '500mg',
    defaultFrequency: '1-0-1',
    defaultDuration: '30 days',
  },
  {
    id: 'med-8',
    name: 'Amlodipine 5mg',
    genericName: 'Amlodipine Besylate',
    category: 'Antihypertensive',
    form: 'Tablet',
    defaultDosage: '5mg',
    defaultFrequency: '1-0-0',
    defaultDuration: '30 days',
  },
  {
    id: 'med-9',
    name: 'Atorvastatin 20mg',
    genericName: 'Atorvastatin Calcium',
    category: 'Lipid-Lowering / Statin',
    form: 'Tablet',
    defaultDosage: '20mg',
    defaultFrequency: '0-0-1',
    defaultDuration: '30 days',
  },
  {
    id: 'med-10',
    name: 'Cetirizine 10mg',
    genericName: 'Cetirizine Hydrochloride',
    category: 'Antihistamine',
    form: 'Tablet',
    defaultDosage: '10mg',
    defaultFrequency: '0-0-1',
    defaultDuration: '5 days',
  },
  {
    id: 'med-11',
    name: 'Montelukast 10mg',
    genericName: 'Montelukast Sodium',
    category: 'Anti-Asthmatic / Leukotriene Inhibitor',
    form: 'Tablet',
    defaultDosage: '10mg',
    defaultFrequency: '0-0-1',
    defaultDuration: '14 days',
  },
  {
    id: 'med-12',
    name: 'Panadol Extra',
    genericName: 'Paracetamol + Caffeine',
    category: 'Analgesic',
    form: 'Tablet',
    defaultDosage: '500mg',
    defaultFrequency: 'SOS',
    defaultDuration: '3 days',
  },
  {
    id: 'ext-losartan-50',
    name: 'Losartan 50mg',
    genericName: 'Losartan Potassium',
    category: 'Antihypertensive (ARB)',
    form: 'Tablet',
    defaultDosage: '50mg',
    defaultFrequency: '1-0-0',
    defaultDuration: '30 days',
  },
  {
    id: 'ext-salbutamol',
    name: 'Salbutamol Inhaler',
    genericName: 'Albuterol Sulfate',
    category: 'Bronchodilator (Asthma)',
    form: 'Inhaler',
    defaultDosage: '100mcg (2 puffs)',
    defaultFrequency: 'SOS',
    defaultDuration: 'As needed',
  },
];

export interface MedicineSearchInputProps {
  onSelectMedicine: (medicine: MedicineSuggestion) => void;
  placeholder?: string;
}

export const MedicineSearchInput: React.FC<MedicineSearchInputProps> = ({
  onSelectMedicine,
  placeholder = 'Search medicines (e.g., Paracetamol, Amoxicillin)...',
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredMedicines = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    const cleanQuery = query.toLowerCase().trim();
    return COMMON_HOSPITAL_MEDICINES.filter(
      (m) =>
        m.name.toLowerCase().includes(cleanQuery) ||
        m.genericName.toLowerCase().includes(cleanQuery) ||
        m.category.toLowerCase().includes(cleanQuery)
    );
  }, [query]);

  const handleSelect = (item: MedicineSuggestion) => {
    onSelectMedicine(item);
    setQuery('');
    setIsFocused(false);
  };

  const handleAddCustom = () => {
    if (!query.trim()) return;
    const customMed: MedicineSuggestion = {
      id: `custom-${Date.now()}`,
      name: query.trim(),
      genericName: 'Custom Formulation',
      category: 'General Rx',
      form: 'Tablet',
      defaultDosage: '1 unit',
      defaultFrequency: '1-0-1',
      defaultDuration: '5 days',
    };
    onSelectMedicine(customMed);
    setQuery('');
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputBox, isFocused && styles.inputBoxFocused]}>
        <Search size={18} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          onFocus={() => setIsFocused(true)}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <X size={16} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggested dropdown list when user types */}
      {isFocused && query.length > 0 && (
        <View style={styles.dropdown}>
          {filteredMedicines.length > 0 ? (
            <FlatList
              data={filteredMedicines}
              keyExtractor={(item: MedicineSuggestion) => item.id}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              renderItem={({ item }: { item: MedicineSuggestion }) => (
                <TouchableOpacity
                  style={styles.suggestionRow}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.iconCircle}>
                    <Pill size={16} color="#0866C6" />
                  </View>
                  <View style={styles.suggestionDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.medicineName}>{item.name}</Text>
                      <View style={styles.formBadge}>
                        <Text style={styles.formBadgeText}>{item.form}</Text>
                      </View>
                    </View>
                    <Text style={styles.genericText} numberOfLines={1}>
                      {item.genericName} • {item.category}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <TouchableOpacity style={styles.addCustomRow} onPress={handleAddCustom}>
              <Plus size={16} color="#0866C6" />
              <Text style={styles.addCustomText}>
                Add "{query}" as custom medication
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 20,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputBoxFocused: {
    borderColor: '#0866C6',
    shadowOpacity: 0.12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#142D4E',
    height: '100%',
  },
  clearButton: {
    padding: 6,
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    maxHeight: 240,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  suggestionDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  formBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  formBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  genericText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
  },
  addCustomText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0866C6',
  },
});
