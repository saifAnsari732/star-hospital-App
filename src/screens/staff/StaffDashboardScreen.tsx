import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Calendar,
  Activity,
  FlaskConical,
  Bell,
  UserPlus,
  Ticket,
  CalendarCheck,
  BedDouble,
  HeartPulse,
  Pill,
  Receipt,
  CreditCard,
  Search,
  ChevronRight,
  Clock,
  Settings,
  ClipboardCheck,
  LogOut,
  Menu,
} from 'lucide-react-native';
import { StarLoader } from '../../components/common';
import { StaffKpiCard } from '../../components/staff/StaffKpiCard';
import { DesignationBadge } from '../../components/staff/DesignationBadge';
import { useAuth } from '../../context/AuthContext';
import {
  canAccessStaffRoute,
  canViewBillingSummary,
  getDashboardKpisForDesignation,
  getDesignationLabel,
  hasStaffPermission,
  normalizeStaffDesignation,
} from '../../components/staff/staffPermissions';
import { staffService } from '../../services/staffService';
import { laboratoryService } from '../../services/laboratoryService';
import { billingService } from '../../services/billingService';
import { pharmacyService } from '../../services/pharmacyService';
import { notificationService } from '../../services/notificationService';
import {
  loadAdminRoleRegistry,
  assignUserRoleByAdmin,
  type AdminManagedAccount,
} from '../../services/authService';
import type { UserRole, StaffDesignation } from '../../types/user';
import type { HospitalKpiMetrics, StaffTask } from '../../types/staff';
import { TextInput } from 'react-native';

interface QuickActionDef {
  key: string;
  label: string;
  subtitle: string;
  route: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

export const StaffDashboardScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const designation = user?.designation;
  const canonical = normalizeStaffDesignation(designation);
  const showBillingSummary = canViewBillingSummary(designation);
  const kpiKeys = getDashboardKpisForDesignation(designation);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<HospitalKpiMetrics | null>(null);
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [pendingLabCount, setPendingLabCount] = useState<number | null>(null);
  const [pendingRxCount, setPendingRxCount] = useState<number | null>(null);
  const [billingMetrics, setBillingMetrics] = useState({
    collectedToday: 0,
    outstandingDue: 0,
    unpaidInvoicesCount: 0,
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [managedAccounts, setManagedAccounts] = useState<AdminManagedAccount[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('doctor');
  const [newStaffDesignation, setNewStaffDesignation] = useState<StaffDesignation>('nurse');
  const [roleStatusBanner, setRoleStatusBanner] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const [metrics, allTasks, notifs, registry] = await Promise.all([
        staffService.getHospitalKpis(),
        staffService.getStaffTasks(),
        notificationService.getNotifications(),
        loadAdminRoleRegistry(),
      ]);

      setKpis(metrics);
      setManagedAccounts(registry);
      const roleTasks =
        canonical === 'admin'
          ? allTasks
          : allTasks.filter(
              (t) => normalizeStaffDesignation(t.designation) === canonical
            );
      setTasks(roleTasks);

      const allowedNotifs = showBillingSummary
        ? notifs
        : notifs.filter((n) => n.category !== 'billing');
      setUnreadNotifications(allowedNotifs.filter((n) => !n.read).length);

      if (hasStaffPermission(designation, 'lab:worklist')) {
        const reports = await laboratoryService.getDiagnosticReports();
        setPendingLabCount(
          reports.filter((r) => r.status === 'pending' || r.status === 'in_progress')
            .length
        );
      }

      if (hasStaffPermission(designation, 'pharmacy:worklist')) {
        const rxList = await pharmacyService.getPharmacyWorklist();
        setPendingRxCount(
          rxList.filter((r) => r.status === 'pending').length
        );
      }

      if (showBillingSummary) {
        const invoices = await billingService.getInvoices();
        const collected = invoices.reduce((s, i) => s + i.amountReceived, 0);
        const outstanding = invoices.reduce((s, i) => s + i.balanceDue, 0);
        const unpaidCount = invoices.filter((i) => i.status !== 'paid').length;
        setBillingMetrics({
          collectedToday: collected || metrics.totalRevenueToday,
          outstandingDue: outstanding,
          unpaidInvoicesCount: unpaidCount,
        });
      }
    } catch {
      setError('Could not refresh Staff Dashboard. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canonical, designation, showBillingSummary]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const allQuickActions: QuickActionDef[] = [
    {
      key: 'reg',
      label: 'New Patient',
      subtitle: 'Register & MRN',
      route: 'StaffPatientReg',
      color: '#0866C6',
      bgColor: '#EFF6FF',
      icon: <UserPlus size={20} color="#0866C6" />,
    },
    {
      key: 'search',
      label: 'Patient Search',
      subtitle: 'Find patient chart',
      route: 'StaffPatientSearch',
      color: '#0284C7',
      bgColor: '#E0F2FE',
      icon: <Search size={20} color="#0284C7" />,
    },
    {
      key: 'book',
      label: 'Book Appointment',
      subtitle: 'Schedule OPD slot',
      route: 'StaffBookAppointment',
      color: '#0866C6',
      bgColor: '#EFF6FF',
      icon: <Calendar size={20} color="#0866C6" />,
    },
    {
      key: 'appts',
      label: 'Appointments',
      subtitle: 'Check-in / Check-out',
      route: 'StaffAppointmentManage',
      color: '#16A34A',
      bgColor: '#DCFCE7',
      icon: <CalendarCheck size={20} color="#16A34A" />,
    },
    {
      key: 'token',
      label: 'OPD Token Gen',
      subtitle: 'Issue queue token',
      route: 'TokenGeneration',
      color: '#0866C6',
      bgColor: '#EFF6FF',
      icon: <Ticket size={20} color="#0866C6" />,
    },
    {
      key: 'queue',
      label: 'OPD Queue',
      subtitle: 'Live waiting desk',
      route: 'StaffOPDQueue',
      color: '#D97706',
      bgColor: '#FEF3C7',
      icon: <Clock size={20} color="#D97706" />,
    },
    {
      key: 'vitals',
      label: 'Vitals Entry',
      subtitle: 'Nurse triage capture',
      route: 'NurseVitals',
      color: '#16A34A',
      bgColor: '#DCFCE7',
      icon: <HeartPulse size={20} color="#16A34A" />,
    },
    {
      key: 'lab',
      label: 'Lab Worklist',
      subtitle: 'Results & PDF upload',
      route: 'LabEntry',
      color: '#D97706',
      bgColor: '#FEF3C7',
      icon: <FlaskConical size={20} color="#D97706" />,
    },
    {
      key: 'pharmacy',
      label: 'Pharmacy Rx',
      subtitle: 'Dispense & inventory',
      route: 'PharmacyDispense',
      color: '#7C3AED',
      bgColor: '#F3E8FF',
      icon: <Pill size={20} color="#7C3AED" />,
    },
    {
      key: 'billing',
      label: 'Billing & Invoice',
      subtitle: 'Create & collect fees',
      route: 'BillingInvoice',
      color: '#0284C7',
      bgColor: '#E0F2FE',
      icon: <Receipt size={20} color="#0284C7" />,
    },
    {
      key: 'payhist',
      label: 'Payment History',
      subtitle: 'Cashier receipts',
      route: 'StaffPaymentHistory',
      color: '#16A34A',
      bgColor: '#DCFCE7',
      icon: <CreditCard size={20} color="#16A34A" />,
    },
    {
      key: 'beds',
      label: canonical === 'nurse' ? 'Bed Availability' : 'Ward Admissions',
      subtitle:
        canonical === 'nurse' ? 'View bed status' : 'Admit & bed matrix',
      route: 'AdmissionBed',
      color: '#0866C6',
      bgColor: '#EFF6FF',
      icon: <BedDouble size={20} color="#0866C6" />,
    },
    {
      key: 'discharge',
      label: 'Discharge Desk',
      subtitle: 'IPD bed clearance',
      route: 'StaffDischarge',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      icon: <LogOut size={20} color="#DC2626" />,
    },
  ];

  const permittedQuickActions = allQuickActions.filter((action) =>
    canAccessStaffRoute(designation, action.route)
  );

  if (loading && !kpis) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarLoader message="Loading Staff Station..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboard();
            }}
            tintColor="#0866C6"
          />
        }
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <TouchableOpacity
              style={[styles.iconBtn, { marginRight: 10 }]}
              onPress={() => navigation.navigate('StaffSettings')}
              accessibilityRole="button"
              accessibilityLabel="Open Staff Menu"
            >
              <Menu size={22} color="#142D4E" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.staffName} numberOfLines={1}>
                Staff Dashboard
              </Text>
              <Text style={styles.welcomeSub} numberOfLines={1}>
                {user?.name || getDesignationLabel(designation)} • Star Hospital
              </Text>
              <View style={styles.badgeWrap}>
                {canonical ? (
                  <DesignationBadge
                    designation={
                      canonical === 'billing'
                        ? 'billing_clerk'
                        : canonical === 'laboratorist'
                          ? 'lab_tech'
                          : canonical
                    }
                    size="sm"
                  />
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('StaffSettings')}
            >
              <Settings size={20} color="#142D4E" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => void logout()}
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <LogOut size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* 4 Full-Width Stacked Colored KPI Cards Matching Reference UI Image */}
        <Text style={styles.sectionTitle}>Staff Dashboard</Text>
        <View style={{ gap: 10, marginBottom: 18 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#E0F2FE',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#BAE6FD',
            }}
            onPress={() => navigation.navigate('StaffTabs', { screen: 'StaffPatientsTab' })}
            activeOpacity={0.85}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: '#0866C6',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Users size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#0369A1' }}>
                Total Patients
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#142D4E', marginTop: 2 }}>
                {kpis?.totalPatients?.toLocaleString() || '1,250'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#DCFCE7',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#BBF7D0',
            }}
            onPress={() => navigation.navigate('StaffOPDQueue')}
            activeOpacity={0.85}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: '#16A34A',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Activity size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#15803D' }}>
                Today OPD
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#142D4E', marginTop: 2 }}>
                {kpis?.todayOpd ?? 320}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FEF3C7',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}
            onPress={() => navigation.navigate('StaffAppointmentManage')}
            activeOpacity={0.85}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: '#D97706',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Calendar size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#B45309' }}>
                Appointments
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#142D4E', marginTop: 2 }}>
                {kpis?.todayAppointments ?? 280}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#EDE9FE',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#DDD6FE',
            }}
            onPress={() => navigation.navigate('LabEntry')}
            activeOpacity={0.85}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                backgroundColor: '#7C3AED',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <FlaskConical size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#6D28D9' }}>
                Reports
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#142D4E', marginTop: 2 }}>
                {pendingLabCount ?? kpis?.reports ?? 180}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Admin Role Assignment Panel: Decide Doctor / Staff / Patient Roles */}
        {canonical === 'admin' ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#BFDBFE',
              marginBottom: 18,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#142D4E', marginBottom: 4 }}>
              Admin Role Management (Assign Doctor / Staff Role)
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
              By default, all new signups/logins are PATIENT. Assign Doctor or Staff roles here:
            </Text>

            {roleStatusBanner ? (
              <View
                style={{
                  backgroundColor: '#DCFCE7',
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#15803D' }}>
                  {roleStatusBanner}
                </Text>
              </View>
            ) : null}

            <TextInput
              style={{
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 42,
                fontSize: 13,
                color: '#142D4E',
                marginBottom: 8,
              }}
              placeholder="User Email or ID (e.g. rahul@gmail.com or dr.neha@starhospital.com)"
              placeholderTextColor="#94A3B8"
              value={newUserEmail}
              onChangeText={setNewUserEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={{
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 42,
                fontSize: 13,
                color: '#142D4E',
                marginBottom: 10,
              }}
              placeholder="Full Name (optional, e.g. Dr. Neha Kapoor)"
              placeholderTextColor="#94A3B8"
              value={newUserName}
              onChangeText={setNewUserName}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {(['patient', 'doctor', 'staff'] as UserRole[]).map((r) => {
                const active = newUserRole === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setNewUserRole(r)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      alignItems: 'center',
                      backgroundColor: active ? '#0866C6' : '#F1F5F9',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: active ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {newUserRole === 'staff' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {(
                  [
                    'nurse',
                    'receptionist',
                    'lab_tech',
                    'pharmacist',
                    'billing_clerk',
                    'admin',
                  ] as StaffDesignation[]
                ).map((des) => {
                  const active = newStaffDesignation === des;
                  return (
                    <TouchableOpacity
                      key={des}
                      onPress={() => setNewStaffDesignation(des)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: active ? '#7C3AED' : '#F3E8FF',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: active ? '#FFFFFF' : '#6D28D9',
                        }}
                      >
                        {des.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            <TouchableOpacity
              style={{
                backgroundColor: '#0866C6',
                borderRadius: 10,
                paddingVertical: 11,
                alignItems: 'center',
                marginBottom: 12,
              }}
              onPress={async () => {
                if (!newUserEmail.trim()) return;
                const updated = await assignUserRoleByAdmin(
                  newUserEmail.trim(),
                  newUserName.trim() || newUserEmail.trim(),
                  newUserRole,
                  newUserRole === 'staff' ? newStaffDesignation : undefined
                );
                setManagedAccounts(updated);
                setRoleStatusBanner(
                  `Assigned role ${newUserRole.toUpperCase()}${
                    newUserRole === 'staff' ? ` (${newStaffDesignation})` : ''
                  } to ${newUserEmail.trim()}`
                );
                setNewUserEmail('');
                setNewUserName('');
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                Save &amp; Assign Role
              </Text>
            </TouchableOpacity>

            {/* Existing Managed Accounts List with 1-Tap Role Toggle */}
            {managedAccounts.map((acc) => (
              <View
                key={acc.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: '#F1F5F9',
                }}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#142D4E' }}>
                    {acc.name} ({acc.id})
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>{acc.email}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {(['patient', 'doctor', 'staff'] as UserRole[]).map((r) => {
                    const isCurrent = acc.role === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        onPress={async () => {
                          const updated = await assignUserRoleByAdmin(
                            acc.email,
                            acc.name,
                            r,
                            r === 'staff' ? acc.designation || 'admin' : undefined
                          );
                          setManagedAccounts(updated);
                          setRoleStatusBanner(
                            `Updated ${acc.email} role to ${r.toUpperCase()}`
                          );
                        }}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          backgroundColor: isCurrent ? '#0866C6' : '#F1F5F9',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: isCurrent ? '#FFFFFF' : '#64748B',
                          }}
                        >
                          {r.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Designation-Filtered Operational KPIs */}
        <Text style={styles.sectionTitle}>Operational Overview</Text>
        <View style={styles.kpiGrid}>
          {kpiKeys.includes('total_patients') ? (
            <View style={styles.kpiCell}>
              <StaffKpiCard
                label="Total Patients"
                value={kpis?.totalPatients?.toLocaleString() || '1,250'}
                icon={Users}
                theme="blue"
                onPress={() =>
                  navigation.navigate('StaffTabs', { screen: 'StaffPatientsTab' })
                }
              />
            </View>
          ) : null}

          {kpiKeys.includes('today_opd') ? (
            <View style={styles.kpiCell}>
              <StaffKpiCard
                label="Today's OPD"
                value={kpis?.todayOpd ?? 320}
                icon={Activity}
                theme="blue"
                onPress={
                  canAccessStaffRoute(designation, 'StaffOPDQueue')
                    ? () => navigation.navigate('StaffOPDQueue')
                    : undefined
                }
              />
            </View>
          ) : null}

          {kpiKeys.includes('today_appointments') ? (
            <View style={styles.kpiCell}>
              <StaffKpiCard
                label="Appointments"
                value={kpis?.todayAppointments ?? 280}
                icon={Calendar}
                theme="purple"
                onPress={
                  canAccessStaffRoute(designation, 'StaffAppointmentManage')
                    ? () => navigation.navigate('StaffAppointmentManage')
                    : undefined
                }
              />
            </View>
          ) : null}

          {kpiKeys.includes('pending_patients') ? (
            <View style={styles.kpiCell}>
              <StaffKpiCard
                label="Pending Patients"
                value={kpis?.pendingAppointments ?? 42}
                icon={Clock}
                theme="orange"
                onPress={
                  canAccessStaffRoute(designation, 'NurseVitals')
                    ? () => navigation.navigate('NurseVitals')
                    : canAccessStaffRoute(designation, 'StaffOPDQueue')
                      ? () => navigation.navigate('StaffOPDQueue')
                      : undefined
                }
              />
            </View>
          ) : null}

          {kpiKeys.includes('pending_lab_requests') ? (
            <View style={styles.kpiCell}>
              <StaffKpiCard
                label="Pending Lab Requests"
                value={pendingLabCount ?? kpis?.reports ?? 180}
                icon={FlaskConical}
                theme="orange"
                onPress={
                  canAccessStaffRoute(designation, 'LabEntry')
                    ? () => navigation.navigate('LabEntry')
                    : undefined
                }
              />
            </View>
          ) : null}

          {kpiKeys.includes('bed_availability') ? (
            <View style={styles.kpiCell}>
              <StaffKpiCard
                label="Available Beds"
                value={`${kpis?.freeBeds ?? 52}/${kpis?.totalBeds ?? 240}`}
                icon={BedDouble}
                theme="green"
                onPress={() => navigation.navigate('AdmissionBed')}
              />
            </View>
          ) : null}

          {kpiKeys.includes('pending_prescriptions') ? (
            <View style={styles.kpiCell}>
              <StaffKpiCard
                label="Pending Rx"
                value={pendingRxCount ?? kpis?.todayPrescriptions ?? 215}
                icon={Pill}
                theme="purple"
                onPress={() => navigation.navigate('PharmacyDispense')}
              />
            </View>
          ) : null}
        </View>

        {/* STRICTLY GATED Billing Summary Card (ONLY billing/billing_clerk/admin) */}
        {showBillingSummary ? (
          <View style={styles.billingSummaryCard}>
            <View style={styles.billingHeader}>
              <View>
                <Text style={styles.billingOverline}>AUTHORIZED ACCOUNTS</Text>
                <Text style={styles.billingTitle}>Billing Summary</Text>
              </View>
              <TouchableOpacity
                style={styles.billingBtn}
                onPress={() => navigation.navigate('BillingInvoice')}
              >
                <Text style={styles.billingBtnText}>Open Cashier</Text>
                <ChevronRight size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.billingStatsRow}>
              <View style={styles.billingStat}>
                <Text style={styles.billingStatLabel}>Collected Today</Text>
                <Text style={styles.billingStatValue}>
                  Rs. {billingMetrics.collectedToday.toLocaleString()}
                </Text>
              </View>
              <View style={styles.billingDivider} />
              <View style={styles.billingStat}>
                <Text style={styles.billingStatLabel}>Outstanding Due</Text>
                <Text style={[styles.billingStatValue, { color: '#FDE68A' }]}>
                  Rs. {billingMetrics.outstandingDue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.billingDivider} />
              <View style={styles.billingStat}>
                <Text style={styles.billingStatLabel}>Open Bills</Text>
                <Text style={styles.billingStatValue}>
                  {billingMetrics.unpaidInvoicesCount}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Permitted Quick Actions Grid */}
        <Text style={styles.sectionTitle}>
          Permitted {getDesignationLabel(designation)} Workflows
        </Text>
        <View style={styles.actionsGrid}>
          {permittedQuickActions.map((act) => (
            <TouchableOpacity
              key={act.key}
              style={styles.actionCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(act.route)}
            >
              <View
                style={[styles.actionIconBox, { backgroundColor: act.bgColor }]}
              >
                {act.icon}
              </View>
              <Text style={styles.actionLabel}>{act.label}</Text>
              <Text style={styles.actionSub}>{act.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Role Tasks Preview */}
        <View style={styles.tasksHeader}>
          <Text style={styles.sectionTitle}>Active Role Tasks ({tasks.length})</Text>
          <TouchableOpacity
            style={styles.viewAllLink}
            onPress={() =>
              navigation.navigate('StaffTabs', {
                screen: 'StaffAppointmentsTab',
              })
            }
          >
            <Text style={styles.viewAllText}>View All Tasks</Text>
            <ChevronRight size={15} color="#0866C6" />
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <View style={styles.emptyTasksBox}>
            <ClipboardCheck size={24} color="#94A3B8" />
            <Text style={styles.emptyTasksText}>
              No pending shift tasks assigned to your designation.
            </Text>
          </View>
        ) : (
          tasks.slice(0, 3).map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.taskRow}
              onPress={() =>
                navigation.navigate('StaffTabs', {
                  screen: 'StaffAppointmentsTab',
                })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{t.title}</Text>
                <Text style={styles.taskSub} numberOfLines={1}>
                  {t.description}
                </Text>
              </View>
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>
                  {t.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  welcomeSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  staffName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#142D4E',
    marginTop: 2,
  },
  badgeWrap: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  kpiCell: {
    width: '48%',
  },
  billingSummaryCard: {
    backgroundColor: '#064A91',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  billingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billingOverline: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.6,
  },
  billingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  billingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0866C6',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  billingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  billingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  billingStat: {
    flex: 1,
    alignItems: 'center',
  },
  billingStatLabel: {
    fontSize: 10,
    color: '#DBEAFE',
    fontWeight: '600',
  },
  billingStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 3,
  },
  billingDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  actionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  emptyTasksBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  emptyTasksText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  taskSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  taskBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0866C6',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StaffDashboardScreen;
