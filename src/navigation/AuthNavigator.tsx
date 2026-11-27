import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from './navigationTypes';
import {
  SplashScreen,
  WelcomeScreen,
  OnboardingScreen,
  RoleSelectionScreen,
  LoginScreen,
  MobileLoginScreen,
  OTPVerificationScreen,
  PatientRegistrationScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  LanguageSelectionScreen,
  ProfileSetupScreen,
  NotificationPermissionScreen,
} from '../screens/auth';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const stackBottomPad = Math.max(insets.bottom, 14);

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#F5F9FF',
          paddingBottom: route.name === 'Splash' ? 0 : stackBottomPad,
        },
      })}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MobileLogin" component={MobileLoginScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="PatientRegistration" component={PatientRegistrationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="NotificationPermission" component={NotificationPermissionScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
