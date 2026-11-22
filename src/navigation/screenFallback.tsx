import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Construction } from 'lucide-react-native';

export function createPlaceholderScreen(title: string, description?: string): React.FC<any> {
  const PlaceholderScreen: React.FC<any> = ({ navigation }) => (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {navigation?.canGoBack?.() && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={24} color="#142D4E" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Construction size={32} color="#0866C6" />
        </View>
        <Text style={styles.contentTitle}>{title}</Text>
        <Text style={styles.contentDescription}>
          {description || 'This screen module is connecting to hospital live services.'}
        </Text>
      </View>
    </SafeAreaView>
  );

  PlaceholderScreen.displayName = `PlaceholderScreen(${title})`;
  return PlaceholderScreen;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 6,
    marginRight: 10,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142D4E',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 8,
    textAlign: 'center',
  },
  contentDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
  },
});
