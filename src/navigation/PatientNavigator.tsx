import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PatientTabParamList, PatientStackParamList } from './navigationTypes';
import { Home, Calendar, FileText, User } from 'lucide-react-native';

// Genuine Patient Module Screens
import { HomeScreen } from '../screens/patient/HomeScreen';
import { AppointmentsListScreen } from '../screens/patient/AppointmentsListScreen';
import { MyReportsScreen } from '../screens/patient/MyReportsScreen';
import { MyProfileScreen } from '../screens/patient/MyProfileScreen';
import { OPDTokenScreen } from '../screens/patient/OPDTokenScreen';
import { QueueStatusScreen } from '../screens/patient/QueueStatusScreen';
import { DoctorsScreen } from '../screens/patient/DoctorsScreen';
import { DoctorProfileScreen } from '../screens/patient/DoctorProfileScreen';
import { BookAppointmentScreen } from '../screens/patient/BookAppointmentScreen';
import { SelectSlotScreen } from '../screens/patient/SelectSlotScreen';
import { BookingConfirmationScreen } from '../screens/patient/BookingConfirmationScreen';
import { AppointmentDetailsScreen } from '../screens/patient/AppointmentDetailsScreen';
import { CancelAppointmentScreen } from '../screens/patient/CancelAppointmentScreen';
import { RescheduleAppointmentScreen } from '../screens/patient/RescheduleAppointmentScreen';
import { MyPrescriptionsScreen } from '../screens/patient/MyPrescriptionsScreen';
import { PrescriptionDetailScreen } from '../screens/patient/PrescriptionDetailScreen';
import { MedicineDetailsScreen } from '../screens/patient/MedicineDetailsScreen';
import { ReportDetailScreen } from '../screens/patient/ReportDetailScreen';
import { LabTestBookingScreen } from '../screens/patient/LabTestBookingScreen';
import { RadiologyReportsScreen } from '../screens/patient/RadiologyReportsScreen';
import { NotificationsScreen } from '../screens/patient/NotificationsScreen';
import { MedicalHistoryScreen } from '../screens/patient/MedicalHistoryScreen';
import { AllergiesScreen } from '../screens/patient/AllergiesScreen';
import { HealthRecordsScreen } from '../screens/patient/HealthRecordsScreen';
import { BillsScreen } from '../screens/patient/BillsScreen';
import { PaymentHistoryScreen } from '../screens/patient/PaymentHistoryScreen';
import { PaymentDetailsScreen } from '../screens/patient/PaymentDetailsScreen';
import { AdmissionsScreen } from '../screens/patient/AdmissionsScreen';
import { VideoConsultationScreen } from '../screens/patient/VideoConsultationScreen';
import { EditProfileScreen } from '../screens/patient/EditProfileScreen';
import { HelpSupportScreen } from '../screens/patient/HelpSupportScreen';
import { ContactHospitalScreen } from '../screens/patient/ContactHospitalScreen';
import { SettingsScreen } from '../screens/patient/SettingsScreen';
import { ChangePasswordScreen } from '../screens/patient/ChangePasswordScreen';

const Tab = createBottomTabNavigator<PatientTabParamList>();
const Stack = createNativeStackNavigator<PatientStackParamList>();

export const PatientTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0866C6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: [
          styles.tabBar,
          {
            height: 58 + bottomPad,
            paddingBottom: bottomPad,
            paddingTop: 8,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsListScreen}
        options={{
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color, size }) => <Calendar size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={MyReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ color, size }) => <FileText size={size || 22} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={MyProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const PatientNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const stackBottomPad = Math.max(insets.bottom, 14);

  return (
    <Stack.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: '#F5F9FF',
          paddingBottom: route.name === 'PatientTabs' ? 0 : stackBottomPad,
        },
      })}
    >
      <Stack.Screen name="PatientTabs" component={PatientTabNavigator} />
      <Stack.Screen name="OPDToken" component={OPDTokenScreen as any} />
      <Stack.Screen name="QueueStatus" component={QueueStatusScreen as any} />
      <Stack.Screen name="FindDoctors" component={DoctorsScreen as any} />
      <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen as any} />
      <Stack.Screen name="BookAppointment" component={BookAppointmentScreen as any} />
      <Stack.Screen name="SelectSlot" component={SelectSlotScreen as any} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen as any} />
      <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen as any} />
      <Stack.Screen name="CancelAppointment" component={CancelAppointmentScreen as any} />
      <Stack.Screen name="RescheduleAppointment" component={RescheduleAppointmentScreen as any} />
      <Stack.Screen name="PrescriptionsList" component={MyPrescriptionsScreen as any} />
      <Stack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen as any} />
      <Stack.Screen name="MedicineDetails" component={MedicineDetailsScreen as any} />
      <Stack.Screen name="ReportsList" component={MyReportsScreen as any} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen as any} />
      <Stack.Screen name="LabTestBooking" component={LabTestBookingScreen as any} />
      <Stack.Screen name="RadiologyReports" component={RadiologyReportsScreen as any} />
      <Stack.Screen name="Notifications" component={NotificationsScreen as any} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen as any} />
      <Stack.Screen name="MedicalHistory" component={MedicalHistoryScreen as any} />
      <Stack.Screen name="Allergies" component={AllergiesScreen as any} />
      <Stack.Screen name="HealthRecords" component={HealthRecordsScreen as any} />
      <Stack.Screen name="Bills" component={BillsScreen as any} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen as any} />
      <Stack.Screen name="PaymentDetails" component={PaymentDetailsScreen as any} />
      <Stack.Screen name="Admissions" component={AdmissionsScreen as any} />
      <Stack.Screen name="VideoConsultation" component={VideoConsultationScreen as any} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen as any} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen as any} />
      <Stack.Screen name="ContactHospital" component={ContactHospitalScreen as any} />
      <Stack.Screen name="Settings" component={SettingsScreen as any} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PatientNavigator;
