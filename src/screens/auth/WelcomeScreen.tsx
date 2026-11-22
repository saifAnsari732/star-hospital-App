import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../../navigation/navigationTypes';
import { TEMPLATE_IMAGES } from '../../assets/images';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'Welcome'>>();

  const handleGetStarted = () => {
    navigation.navigate('PatientRegistration');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Top Doctor Thumbs-Up Character Illustration from Template */}
        <View style={styles.graphicContainer}>
          <View style={styles.doctorFrame}>
            <Image
              source={TEMPLATE_IMAGES.welcomeDoctor}
              style={styles.doctorImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Text Section */}
        <View style={styles.textContainer}>
          <Text style={styles.headline}>{'Welcome to\nStar Hospital'}</Text>
          <Text style={styles.subtitle}>Your Health, Our Priority</Text>

          {/* 3-Dot Carousel Indicator */}
          <View style={styles.dotsRow}>
            <View style={styles.activeDot} />
            <View style={styles.inactiveDot} />
            <View style={styles.inactiveDot} />
          </View>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Get Started with Star Hospital"
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogin}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Login to account"
          >
            <Text style={styles.secondaryButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F8FF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  graphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  doctorFrame: {
    width: 268,
    height: 248,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorImage: {
    width: 268,
    height: 248,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headline: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
    color: '#0D2342',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0866C6',
    marginHorizontal: 5,
  },
  inactiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#BFDBFE',
    marginHorizontal: 5,
  },
  actionsContainer: {
    width: '100%',
    paddingBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#0866C6',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0D2342',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default WelcomeScreen;
