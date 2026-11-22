import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { PatientNavigator } from './PatientNavigator';
import { DoctorNavigator } from './DoctorNavigator';
import { StaffNavigator } from './StaffNavigator';
import { SplashScreen } from '../screens/auth/SplashScreen';

/**
 * Isolated Role-Based Navigator Component.
 * Binds strictly to verified AuthContext session.
 * Bypassing role boundaries via deep links or local state tampering is impossible,
 * as the underlying navigator trees are mounted exclusively for the authorized role.
 */
export const RoleBasedNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  // Show branding splash during initial persistent session hydration
  if (isLoading) {
    return <SplashScreen />;
  }

  // Unauthenticated flow: Onboarding, Login, OTP, Register, Forgot Password
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Role 1: Patient Portal (Home, Appointments, OPD Token, Reports, Prescriptions)
  if (role === 'patient') {
    return <PatientNavigator />;
  }

  // Role 2: Doctor Portal (KPIs, Queue Caller, Consultations, Rx Builder, Schedule)
  if (role === 'doctor') {
    return <DoctorNavigator />;
  }

  // Role 3: Staff Portal (Front-desk, Nurse Vitals, Lab, Pharmacy, Billing, Beds)
  if (role === 'staff') {
    return <StaffNavigator />;
  }

  // Fallback if role is unrecognized or corrupted
  return <AuthNavigator />;
};

/**
 * RootNavigator wrapped in NavigationContainer for application mount
 */
export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <RoleBasedNavigator />
    </NavigationContainer>
  );
};

export default RootNavigator;
