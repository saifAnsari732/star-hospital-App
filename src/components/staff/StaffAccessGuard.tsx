import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldAlert, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import {
  canAccessStaffRoute,
  getDesignationLabel,
  hasStaffPermission,
  StaffPermission,
} from './staffPermissions';

interface StaffAccessGuardProps {
  routeName?: string;
  requiredPermission?: StaffPermission;
  featureTitle: string;
  navigation: {
    navigate: (route: string, params?: any) => void;
    goBack?: () => void;
    canGoBack?: () => boolean;
  };
  children: React.ReactNode;
}

export const StaffAccessGuard: React.FC<StaffAccessGuardProps> = ({
  routeName,
  requiredPermission,
  featureTitle,
  navigation,
  children,
}) => {
  const { user } = useAuth();
  const designation = user?.designation;

  const allowed = requiredPermission
    ? hasStaffPermission(designation, requiredPermission)
    : routeName
      ? canAccessStaffRoute(designation, routeName)
      : false;

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <ShieldAlert size={36} color="#DC2626" />
        </View>
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.subtitle}>
          Your active staff designation ({getDesignationLabel(designation)}) does not have
          permission to access {featureTitle}.
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>RBAC Policy Enforced</Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() => {
            if (navigation.canGoBack && navigation.canGoBack() && navigation.goBack) {
              navigation.goBack();
            } else {
              navigation.navigate('StaffTabs');
            }
          }}
        >
          <ArrowLeft size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Return to Staff Dashboard</Text>
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0866C6',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default StaffAccessGuard;
