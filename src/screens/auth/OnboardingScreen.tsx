import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../../navigation/navigationTypes';
import { CalendarCheck, Ticket, FileText, ArrowRight, Check } from 'lucide-react-native';
import Svg, { Circle, Rect, Path } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  illustrationType: 'appointment' | 'queue' | 'records';
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    badge: 'Easy Access',
    badgeColor: '#0866C6',
    badgeBg: '#EBF4FF',
    title: 'Seamless Appointments',
    subtitle:
      'Book consultations with certified medical specialists in 3 quick steps. Choose your preferred doctor, date, and time slot with instant confirmation.',
    illustrationType: 'appointment',
  },
  {
    id: '2',
    badge: 'Better Care',
    badgeColor: '#10B981',
    badgeBg: '#ECFDF5',
    title: 'Live OPD Queue Tracking',
    subtitle:
      'Say goodbye to crowded hospital waiting rooms. Monitor your live OPD token, real-time queue position, and estimated wait minutes from your phone.',
    illustrationType: 'queue',
  },
  {
    id: '3',
    badge: 'Trusted Hospital',
    badgeColor: '#064A91',
    badgeBg: '#E0E7FF',
    title: 'Instant Medical Records',
    subtitle:
      'Access your electronic health records, diagnostic lab reports, digital prescriptions, and discharge summaries anytime, anywhere with complete privacy.',
    illustrationType: 'records',
  },
];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<AuthNavigationProp<'Onboarding'>>();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('RoleSelection');
    }
  };

  const handleSkip = () => {
    navigation.navigate('RoleSelection');
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const renderIllustration = (type: OnboardingSlide['illustrationType']) => {
    if (type === 'appointment') {
      return (
        <View style={styles.illustrationWrapper}>
          <Svg width={200} height={180} viewBox="0 0 200 180" fill="none">
            <Circle cx="100" cy="90" r="80" fill="#EBF4FF" />
            <Rect x="40" y="45" width="120" height="95" rx="12" fill="#FFFFFF" stroke="#0866C6" strokeWidth="2.5" />
            <Rect x="40" y="45" width="120" height="26" rx="12" fill="#0866C6" />
            <Rect x="60" y="36" width="8" height="18" rx="4" fill="#064A91" />
            <Rect x="132" y="36" width="8" height="18" rx="4" fill="#064A91" />
            {/* Calendar grid dots */}
            <Circle cx="65" cy="90" r="6" fill="#BFDBFE" />
            <Circle cx="90" cy="90" r="6" fill="#BFDBFE" />
            <Circle cx="115" cy="90" r="6" fill="#BFDBFE" />
            <Circle cx="140" cy="90" r="6" fill="#BFDBFE" />
            <Circle cx="65" cy="112" r="6" fill="#BFDBFE" />
            <Circle cx="90" cy="112" r="6" fill="#0866C6" />
            <Circle cx="115" cy="112" r="6" fill="#BFDBFE" />
            <Circle cx="140" cy="112" r="6" fill="#13B8A6" />
          </Svg>
          <View style={styles.centerIconPill}>
            <CalendarCheck size={26} color="#0866C6" />
          </View>
        </View>
      );
    }
    if (type === 'queue') {
      return (
        <View style={styles.illustrationWrapper}>
          <Svg width={200} height={180} viewBox="0 0 200 180" fill="none">
            <Circle cx="100" cy="90" r="80" fill="#ECFDF5" />
            {/* Ticket Graphic */}
            <Rect x="45" y="50" width="110" height="80" rx="14" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
            <Path d="M45 90 C 55 90, 55 100, 45 100" fill="#ECFDF5" />
            <Path d="M155 90 C 145 90, 145 100, 155 100" fill="#ECFDF5" />
            <Rect x="68" y="70" width="64" height="18" rx="4" fill="#10B981" />
            {/* Step circles */}
            <Circle cx="65" cy="110" r="6" fill="#10B981" />
            <Rect x="73" y="108" width="16" height="4" fill="#10B981" />
            <Circle cx="95" cy="110" r="6" fill="#10B981" />
            <Rect x="103" y="108" width="16" height="4" fill="#CBD5E1" />
            <Circle cx="125" cy="110" r="6" fill="#CBD5E1" />
          </Svg>
          <View style={[styles.centerIconPill, { borderColor: '#10B981' }]}>
            <Ticket size={26} color="#10B981" />
          </View>
        </View>
      );
    }
    return (
      <View style={styles.illustrationWrapper}>
        <Svg width={200} height={180} viewBox="0 0 200 180" fill="none">
          <Circle cx="100" cy="90" r="80" fill="#EFF6FF" />
          <Rect x="50" y="40" width="100" height="105" rx="10" fill="#FFFFFF" stroke="#064A91" strokeWidth="2.5" />
          <Rect x="65" y="60" width="50" height="6" rx="3" fill="#BFDBFE" />
          <Rect x="65" y="75" width="70" height="6" rx="3" fill="#CBD5E1" />
          <Rect x="65" y="90" width="60" height="6" rx="3" fill="#CBD5E1" />
          <Circle cx="118" cy="115" r="16" fill="#0866C6" />
          <Path d="M112 115 L116 119 L125 110" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
        <View style={[styles.centerIconPill, { borderColor: '#064A91' }]}>
          <FileText size={26} color="#064A91" />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header with Skip Button */}
      <View style={styles.headerRow}>
        <Text style={styles.brandSmall}>Star Hospital</Text>
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slideContainer}>
            {renderIllustration(item.illustrationType)}

            <View style={[styles.badgeContainer, { backgroundColor: item.badgeBg }]}>
              <Text style={[styles.badgeText, { color: item.badgeColor }]}>{item.badge}</Text>
            </View>

            <Text style={styles.titleText}>{item.title}</Text>
            <Text style={styles.subtitleText}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Footer Controls: Dots & Navigation Button */}
      <View style={styles.footerContainer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleNext}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next Slide'}
        >
          <Text style={styles.actionButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          {currentIndex === SLIDES.length - 1 ? (
            <Check size={18} color="#FFFFFF" strokeWidth={2.5} style={styles.buttonIcon} />
          ) : (
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} style={styles.buttonIcon} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  brandSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: '#064A91',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  centerIconPill: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0866C6',
    borderRadius: 9999,
    padding: 10,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleText: {
    fontSize: 23,
    fontWeight: '800',
    color: '#142D4E',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  footerContainer: {
    paddingHorizontal: 28,
    paddingBottom: 28,
    paddingTop: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#0866C6',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#CBD5E1',
  },
  actionButton: {
    backgroundColor: '#0866C6',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default OnboardingScreen;
