import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../../navigation/navigationTypes';
import { Globe, ChevronLeft, Check, ArrowRight } from 'lucide-react-native';

const LANGUAGE_STORAGE_KEY = '@star_hospital_language';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English (Default)' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

export const LanguageSelectionScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'LanguageSelection'>>();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((saved) => {
        if (saved) setSelectedLanguage(saved);
      })
      .catch(() => {
        // Default to English
      });
  }, []);

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
    } catch {
      // Non-fatal storage issue
    }
    navigation.navigate('Onboarding');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Nav Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={24} color="#142D4E" />
          </TouchableOpacity>
        </View>

        {/* Header Icon */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Globe size={28} color="#0866C6" strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>Select Language</Text>
          <Text style={styles.subtitle}>
            Choose your preferred language for clinical records, OPD tokens, and notifications.
          </Text>
        </View>

        {/* Language Options List */}
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langItem, isSelected && styles.langItemActive]}
                onPress={() => setSelectedLanguage(lang.code)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View>
                  <Text style={[styles.langName, isSelected && styles.langNameActive]}>
                    {lang.name}
                  </Text>
                  <Text style={styles.langNative}>{lang.nativeName}</Text>
                </View>

                <View
                  style={[
                    styles.radioCircle,
                    isSelected ? styles.radioCircleActive : styles.radioCircleInactive,
                  ]}
                >
                  {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Confirm language selection"
          >
            <Text style={styles.continueButtonText}>Confirm & Continue</Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} style={styles.continueIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  listContainer: {
    flex: 1,
    marginBottom: 16,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  langItemActive: {
    borderColor: '#0866C6',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  langName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 2,
  },
  langNameActive: {
    color: '#0866C6',
  },
  langNative: {
    fontSize: 13,
    color: '#64748B',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleInactive: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  radioCircleActive: {
    backgroundColor: '#0866C6',
  },
  footer: {
    paddingTop: 8,
  },
  continueButton: {
    backgroundColor: '#0866C6',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  continueIcon: {
    marginLeft: 8,
  },
});

export default LanguageSelectionScreen;
