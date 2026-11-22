import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Users, Calendar, User } from 'lucide-react-native';

import {
  DoctorDashboardScreen,
  DoctorPatientListScreen,
  DoctorPatientDetailsScreen,
  OPDQueueCallerScreen,
  ConsultationNotesScreen,
  PrescriptionBuilderScreen,
  DoctorScheduleScreen,
  DoctorProfileScreen,
  DoctorVideoConsultationScreen,
  DoctorNotificationsScreen,
  DoctorSettingsScreen,
} from '../screens/doctor';
import { colors } from '../theme/colors';
import { DoctorTabParamList } from './navigationTypes';

export type DoctorStackParamList = {
  DoctorTabs: NavigatorScreenParams<DoctorTabParamList> | undefined;
  OPDQueueCaller: { doctorId?: string; tokenId?: string } | undefined;
  Consultation:
    | {
        appointmentId?: string;
        patientId?: string;
        patientName?: string;
        patientMrn?: string;
        tokenId?: string;
        tokenNumber?: string;
        vitals?: any;
        patient?: any;
        initialNotes?: string;
      }
    | undefined;
  PrescriptionBuilder:
    | {
        appointmentId?: string;
        patientId?: string;
        patientName?: string;
        patientMrn?: string;
        patientAge?: string;
        patientGender?: string;
        diagnosis?: string;
        symptoms?: string;
        patient?: any;
      }
    | undefined;
  PatientDetail:
    | {
        patientId?: string;
        patient?: any;
        initialTab?: 'history' | 'allergies' | 'vitals' | 'records';
      }
    | undefined;
  DoctorNotifications: undefined;
  VideoConsultation:
    | {
        appointmentId?: string;
        patientId?: string;
        patientName?: string;
        patientMrn?: string;
        roomUrl?: string;
      }
    | undefined;
  DoctorSettings: undefined;
};

const Tab = createBottomTabNavigator<DoctorTabParamList>();
const Stack = createNativeStackNavigator<DoctorStackParamList>();

const DoctorTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 58 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          const iconSize = size || 22;
          switch (route.name) {
            case 'DoctorDashboardTab':
              return <LayoutDashboard color={color} size={iconSize} />;
            case 'PatientsTab':
              return <Users color={color} size={iconSize} />;
            case 'ScheduleTab':
              return <Calendar color={color} size={iconSize} />;
            case 'DoctorProfileTab':
              return <User color={color} size={iconSize} />;
          }
        },
      })}
    >
      <Tab.Screen
        name="DoctorDashboardTab"
        component={DoctorDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="PatientsTab"
        component={DoctorPatientListScreen}
        options={{ tabBarLabel: 'Patients' }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={DoctorScheduleScreen}
        options={{ tabBarLabel: 'Schedule' }}
      />
      <Tab.Screen
        name="DoctorProfileTab"
        component={DoctorProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const DoctorTabNavigator = DoctorTabs;

export const DoctorNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const stackBottomPad = Math.max(insets.bottom, 14);

  return (
    <Stack.Navigator
      initialRouteName="DoctorTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
          paddingBottom: route.name === 'DoctorTabs' ? 0 : stackBottomPad,
        },
      })}
    >
      <Stack.Screen name="DoctorTabs" component={DoctorTabs} />
      <Stack.Screen name="OPDQueueCaller" component={OPDQueueCallerScreen} />
      <Stack.Screen name="Consultation" component={ConsultationNotesScreen} />
      <Stack.Screen
        name="PrescriptionBuilder"
        component={PrescriptionBuilderScreen}
      />
      <Stack.Screen
        name="PatientDetail"
        component={DoctorPatientDetailsScreen}
      />
      <Stack.Screen
        name="DoctorNotifications"
        component={DoctorNotificationsScreen}
      />
      <Stack.Screen
        name="VideoConsultation"
        component={DoctorVideoConsultationScreen}
      />
      <Stack.Screen name="DoctorSettings" component={DoctorSettingsScreen} />
    </Stack.Navigator>
  );
};

export default DoctorNavigator;
