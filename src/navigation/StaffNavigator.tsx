import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  User,
} from 'lucide-react-native';

import {
  StaffDashboardScreen,
  StaffPatientRegScreen,
  StaffPatientSearchScreen,
  StaffPatientDetailsScreen,
  StaffAppointmentManageScreen,
  StaffBookAppointmentScreen,
  OPDTokenGenerateScreen,
  StaffOPDQueueScreen,
  NurseVitalsScreen,
  LabWorklistScreen,
  StaffLabTestDetailScreen,
  PharmacyWorklistScreen,
  BillingDashboardScreen,
  StaffPaymentHistoryScreen,
  BedAdmissionScreen,
  StaffDischargeScreen,
  StaffTasksScreen,
  StaffNotificationsScreen,
  StaffSettingsScreen,
  StaffProfileScreen,
} from '../screens/staff';
import { StaffAccessGuard } from '../components/staff/StaffAccessGuard';
import { colors } from '../theme/colors';
import { StaffTabParamList } from './navigationTypes';

export type StaffStackParamList = {
  StaffTabs: NavigatorScreenParams<StaffTabParamList> | undefined;
  StaffPatientReg: undefined;
  StaffPatientSearch: undefined;
  StaffPatientDetails:
    | {
        patientId?: string;
        patient?: any;
      }
    | undefined;
  StaffAppointmentManage: undefined;
  StaffBookAppointment:
    | {
        patientId?: string;
        patientName?: string;
      }
    | undefined;
  TokenGeneration:
    | {
        patientId?: string;
        patientName?: string;
        patientPhone?: string;
        doctorId?: string;
      }
    | undefined;
  StaffOPDQueue: undefined;
  NurseVitals:
    | {
        patientId?: string;
        patientName?: string;
      }
    | undefined;
  LabEntry: undefined;
  StaffLabTestDetail:
    | {
        reportId?: string;
        report?: any;
      }
    | undefined;
  PharmacyDispense: undefined;
  BillingInvoice:
    | {
        patientId?: string;
      }
    | undefined;
  StaffPaymentHistory: undefined;
  AdmissionBed: undefined;
  StaffDischarge: undefined;
  StaffNotifications: undefined;
  StaffSettings: undefined;
  StaffProfile: undefined;
};

const Tab = createBottomTabNavigator<StaffTabParamList>();
const Stack = createNativeStackNavigator<StaffStackParamList>();

function withRoleGuard<P extends { navigation: any; route?: any }>(
  routeName: string,
  featureTitle: string,
  Component: React.ComponentType<P>
): React.FC<P> {
  const GuardedScreen: React.FC<P> = (props) => (
    <StaffAccessGuard
      routeName={routeName}
      featureTitle={featureTitle}
      navigation={props.navigation}
    >
      <Component {...props} />
    </StaffAccessGuard>
  );
  return GuardedScreen;
}

const GuardedPatientReg = withRoleGuard(
  'StaffPatientReg',
  'Patient Registration',
  StaffPatientRegScreen
);
const GuardedPatientSearch = withRoleGuard(
  'StaffPatientSearch',
  'Patient Directory',
  StaffPatientSearchScreen
);
const GuardedPatientDetails = withRoleGuard(
  'StaffPatientDetails',
  'Patient Details',
  StaffPatientDetailsScreen
);
const GuardedAppointmentManage = withRoleGuard(
  'StaffAppointmentManage',
  'Appointment Management',
  StaffAppointmentManageScreen
);
const GuardedBookAppointment = withRoleGuard(
  'StaffBookAppointment',
  'Book Appointment',
  StaffBookAppointmentScreen
);
const GuardedTokenGen = withRoleGuard(
  'TokenGeneration',
  'OPD Token Generation',
  OPDTokenGenerateScreen
);
const GuardedOPDQueue = withRoleGuard(
  'StaffOPDQueue',
  'OPD Queue Management',
  StaffOPDQueueScreen
);
const GuardedNurseVitals = withRoleGuard(
  'NurseVitals',
  'Patient Vitals Entry',
  NurseVitalsScreen
);
const GuardedLabEntry = withRoleGuard(
  'LabEntry',
  'Laboratory Worklist',
  LabWorklistScreen
);
const GuardedLabTestDetail = withRoleGuard(
  'StaffLabTestDetail',
  'Lab Test Details & Report Upload',
  StaffLabTestDetailScreen
);
const GuardedPharmacyDispense = withRoleGuard(
  'PharmacyDispense',
  'Pharmacy & Medicine Dispensing',
  PharmacyWorklistScreen
);
const GuardedBillingInvoice = withRoleGuard(
  'BillingInvoice',
  'Billing & Invoice Management',
  BillingDashboardScreen
);
const GuardedPaymentHistory = withRoleGuard(
  'StaffPaymentHistory',
  'Payment History Ledger',
  StaffPaymentHistoryScreen
);
const GuardedAdmissionBed = withRoleGuard(
  'AdmissionBed',
  'Ward & Bed Availability',
  BedAdmissionScreen
);
const GuardedDischarge = withRoleGuard(
  'StaffDischarge',
  'IPD Discharge Management',
  StaffDischargeScreen
);

const StaffTabs: React.FC = () => {
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
            case 'StaffDashboardTab':
              return <LayoutDashboard color={color} size={iconSize} />;
            case 'StaffPatientsTab':
              return <Users color={color} size={iconSize} />;
            case 'StaffAppointmentsTab':
              return <ClipboardCheck color={color} size={iconSize} />;
            case 'StaffMoreTab':
              return <User color={color} size={iconSize} />;
          }
        },
      })}
    >
      <Tab.Screen
        name="StaffDashboardTab"
        component={StaffDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="StaffPatientsTab"
        component={StaffPatientSearchScreen}
        options={{ tabBarLabel: 'Patients' }}
      />
      <Tab.Screen
        name="StaffAppointmentsTab"
        component={StaffTasksScreen}
        options={{ tabBarLabel: 'Appointments' }}
      />
      <Tab.Screen
        name="StaffMoreTab"
        component={StaffProfileScreen}
        options={{ tabBarLabel: 'More' }}
      />
    </Tab.Navigator>
  );
};

export const StaffTabNavigator = StaffTabs;

export const StaffNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const stackBottomPad = Math.max(insets.bottom, 14);

  return (
    <Stack.Navigator
      initialRouteName="StaffTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
          paddingBottom: route.name === 'StaffTabs' ? 0 : stackBottomPad,
        },
      })}
    >
      <Stack.Screen name="StaffTabs" component={StaffTabs} />
      <Stack.Screen name="StaffPatientReg" component={GuardedPatientReg} />
      <Stack.Screen
        name="StaffPatientSearch"
        component={GuardedPatientSearch}
      />
      <Stack.Screen
        name="StaffPatientDetails"
        component={GuardedPatientDetails}
      />
      <Stack.Screen
        name="StaffAppointmentManage"
        component={GuardedAppointmentManage}
      />
      <Stack.Screen
        name="StaffBookAppointment"
        component={GuardedBookAppointment}
      />
      <Stack.Screen name="TokenGeneration" component={GuardedTokenGen} />
      <Stack.Screen name="StaffOPDQueue" component={GuardedOPDQueue} />
      <Stack.Screen name="NurseVitals" component={GuardedNurseVitals} />
      <Stack.Screen name="LabEntry" component={GuardedLabEntry} />
      <Stack.Screen
        name="StaffLabTestDetail"
        component={GuardedLabTestDetail}
      />
      <Stack.Screen
        name="PharmacyDispense"
        component={GuardedPharmacyDispense}
      />
      <Stack.Screen
        name="BillingInvoice"
        component={GuardedBillingInvoice}
      />
      <Stack.Screen
        name="StaffPaymentHistory"
        component={GuardedPaymentHistory}
      />
      <Stack.Screen name="AdmissionBed" component={GuardedAdmissionBed} />
      <Stack.Screen name="StaffDischarge" component={GuardedDischarge} />
      <Stack.Screen
        name="StaffNotifications"
        component={StaffNotificationsScreen}
      />
      <Stack.Screen name="StaffSettings" component={StaffSettingsScreen} />
      <Stack.Screen name="StaffProfile" component={StaffProfileScreen} />
    </Stack.Navigator>
  );
};

export default StaffNavigator;
