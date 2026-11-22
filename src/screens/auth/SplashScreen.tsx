import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  StatusBar,
  useWindowDimensions,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NavigationContext } from '@react-navigation/native';
import { AuthNavigationProp } from '../../navigation/navigationTypes';
import { useAuth } from '../../context/AuthContext';
import { TEMPLATE_IMAGES } from '../../assets/images';

export const SplashScreen: React.FC = () => {
  const { width: screenWidth } = useWindowDimensions();
  const effectiveWidth = Math.max(screenWidth || 375, 320);
  const navigation = React.useContext(NavigationContext);
  const { isAuthenticated, isLoading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 850,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 42,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        if (navigation && 'replace' in navigation) {
          (navigation as AuthNavigationProp<'Splash'>).replace('Welcome');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, navigation, fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Upper Brand & Logo Section */}
      <Animated.View
        style={[
          styles.brandSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image source={TEMPLATE_IMAGES.starLogo} style={styles.starLogo} resizeMode="contain" />
        <Text style={styles.brandTitle}>Star Hospital</Text>
        <Text style={styles.brandTagline}>Care Today... Healthier Tomorrow...</Text>
      </Animated.View>

      {/* Bottom Hospital Building Photo + Royal Blue Wave & Spinner */}
      <View style={styles.bottomSection}>
        <Image
          source={TEMPLATE_IMAGES.splashHospital}
          style={styles.hospitalPhoto}
          resizeMode="cover"
        />

        <View style={styles.footerWaveContainer}>
          <Svg width={effectiveWidth} height={116} viewBox={`0 0 ${effectiveWidth} 116`} fill="none">
            <Path
              d={`M0 24 Q ${effectiveWidth * 0.35} 0 ${effectiveWidth * 0.68} 26 T ${effectiveWidth} 18 L ${effectiveWidth} 116 L 0 116 Z`}
              fill="#064A91"
            />
            <Path
              d={`M0 36 Q ${effectiveWidth * 0.36} 14 ${effectiveWidth * 0.72} 38 T ${effectiveWidth} 28 L ${effectiveWidth} 116 L 0 116 Z`}
              fill="#0866C6"
            />
          </Svg>
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF5FF',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  starLogo: {
    width: 118,
    height: 94,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0D2342',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E3A5F',
    letterSpacing: 0.2,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  hospitalPhoto: {
    width: '100%',
    height: 220,
    marginBottom: -28,
  },
  footerWaveContainer: {
    width: '100%',
    height: 116,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  loaderOverlay: {
    position: 'absolute',
    bottom: 28,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashScreen;
