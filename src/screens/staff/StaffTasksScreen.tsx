import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  CheckCircle2,
  Clock,
  ChevronRight,
  CalendarCheck,
  HeartPulse,
  FlaskConical,
  Pill,
  Receipt,
  Ticket,
  BedDouble,
} from 'lucide-react-native';
import { StarLoader, EmptyState } from '../../components/common';
import { DesignationBadge } from '../../components/staff/DesignationBadge';
import { useAuth } from '../../context/AuthContext';
import {
  getDesignationLabel,
  hasStaffPermission,
  normalizeStaffDesignation,
} from '../../components/staff/staffPermissions';
import { staffService } from '../../services/staffService';
import type { StaffTask } from '../../types/staff';

interface RoleWorkflowShortcut {
  label: string;
  subtitle: string;
  route: string;
  icon: React.ReactNode;
}

export const StaffTasksScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const designation = user?.designation;
  const canonical = normalizeStaffDesignation(designation);

  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'in_progress' | 'completed'
  >('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const allTasks = await staffService.getStaffTasks();
      const roleFiltered =
        canonical === 'admin'
          ? allTasks
          : allTasks.filter(
              (t) => normalizeStaffDesignation(t.designation) === canonical
            );
      setTasks(roleFiltered);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canonical]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const roleShortcuts = useMemo<RoleWorkflowShortcut[]>(() => {
    const items: RoleWorkflowShortcut[] = [];
    if (hasStaffPermission(designation, 'appointments:view')) {
      items.push({
        label: 'Appointment Check-in / Out',
        subtitle: 'Manage daily appointments, check-ins, and rescheduling',
        route: 'StaffAppointmentManage',
        icon: <CalendarCheck size={18} color="#0866C6" />,
      });
    }
    if (hasStaffPermission(designation, 'opd:token_generate')) {
      items.push({
        label: 'OPD Token & Queue Desk',
        subtitle: 'Issue walk-in tokens and manage active waiting queue',
        route: 'StaffOPDQueue',
        icon: <Ticket size={18} color="#0866C6" />,
      });
    }
    if (hasStaffPermission(designation, 'vitals:record')) {
      items.push({
        label: 'Patient Vitals Queue',
        subtitle: 'Record triage BP, pulse, temperature, and SpO2',
        route: 'NurseVitals',
        icon: <HeartPulse size={18} color="#16A34A" />,
      });
    }
    if (hasStaffPermission(designation, 'lab:worklist')) {
      items.push({
        label: 'Laboratory Worklist & Reports',
        subtitle: 'Enter parameters and upload diagnostic report PDFs',
        route: 'LabEntry',
        icon: <FlaskConical size={18} color="#D97706" />,
      });
    }
    if (hasStaffPermission(designation, 'pharmacy:worklist')) {
      items.push({
        label: 'Pharmacy Rx Dispensing',
        subtitle: 'Verify prescriptions, dispense drugs & inspect stock',
        route: 'PharmacyDispense',
        icon: <Pill size={18} color="#7C3AED" />,
      });
    }
    if (hasStaffPermission(designation, 'billing:invoices_list')) {
      items.push({
        label: 'Billing & Payment Collection',
        subtitle: 'Generate OPD/IPD invoices & settle balances',
        route: 'BillingInvoice',
        icon: <Receipt size={18} color="#0284C7" />,
      });
    }
    if (hasStaffPermission(designation, 'beds:view')) {
      items.push({
        label: 'Ward Bed Availability',
        subtitle:
          canonical === 'admin'
            ? 'Manage ward beds, admissions & discharges'
            : 'Inspect inpatient ward occupancy & bed availability',
        route: 'AdmissionBed',
        icon: <BedDouble size={18} color="#0866C6" />,
      });
    }
    return items;
  }, [designation, canonical]);

  const visibleTasks = useMemo(() => {
    if (statusFilter === 'all') return tasks;
    return tasks.filter((t) => t.status === statusFilter);
  }, [tasks, statusFilter]);

  const handleAdvanceTask = async (task: StaffTask) => {
    const nextStatus: StaffTask['status'] =
      task.status === 'pending'
        ? 'in_progress'
        : task.status === 'in_progress'
          ? 'completed'
          : 'pending';
    const updated = await staffService.updateTaskStatus(task.id, nextStatus);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...updated } : t)));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>My Role Tasks</Text>
          <Text style={styles.subtitle}>
            Authorized workflows for {getDesignationLabel(designation)}
          </Text>
        </View>
        {canonical ? (
          <DesignationBadge
            designation={
              canonical === 'billing'
                ? 'billing_clerk'
                : canonical === 'laboratorist'
                  ? 'lab_tech'
                  : canonical
            }
          />
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTasks();
            }}
            tintColor="#0866C6"
          />
        }
      >
        {/* Role-specific Worklist Entrypoints */}
        <Text style={styles.sectionTitle}>Permitted Shift Workflows</Text>
        <View style={styles.shortcutsList}>
          {roleShortcuts.map((sc) => (
            <TouchableOpacity
              key={sc.route}
              style={styles.shortcutCard}
              activeOpacity={0.82}
              onPress={() => navigation.navigate(sc.route)}
            >
              <View style={styles.shortcutIcon}>{sc.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shortcutLabel}>{sc.label}</Text>
                <Text style={styles.shortcutSub}>{sc.subtitle}</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Task Filter */}
        <Text style={styles.sectionTitle}>Assigned Shift Tasks</Text>
        <View style={styles.filterRow}>
          {(['all', 'pending', 'in_progress', 'completed'] as const).map(
            (st) => {
              const active = statusFilter === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {st.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {loading ? (
          <StarLoader message="Loading role tasks..." />
        ) : visibleTasks.length === 0 ? (
          <EmptyState
            title="No Shift Tasks in View"
            description="All assigned tasks for your designation are up to date."
          />
        ) : (
          visibleTasks.map((task) => {
            const isDone = task.status === 'completed';
            return (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskTop}>
                  <View
                    style={[
                      styles.priorityBadge,
                      task.priority === 'urgent' || task.priority === 'high'
                        ? { backgroundColor: '#FEE2E2' }
                        : { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        task.priority === 'urgent' || task.priority === 'high'
                          ? { color: '#DC2626' }
                          : { color: '#0866C6' },
                      ]}
                    >
                      {task.priority.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.taskStatus}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDesc}>{task.description}</Text>

                <View style={styles.taskFooter}>
                  <View style={styles.dueWrap}>
                    <Clock size={12} color="#64748B" />
                    <Text style={styles.dueText}>
                      Due: {task.dueDate.split('T')[0]}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.progressBtn,
                      isDone && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
                    ]}
                    onPress={() => handleAdvanceTask(task)}
                  >
                    <CheckCircle2
                      size={14}
                      color={isDone ? '#16A34A' : '#0866C6'}
                    />
                    <Text
                      style={[
                        styles.progressBtnText,
                        isDone && { color: '#166534' },
                      ]}
                    >
                      {task.status === 'pending'
                        ? 'Start Task'
                        : task.status === 'in_progress'
                          ? 'Mark Completed'
                          : 'Reopen'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 10,
    marginTop: 6,
  },
  shortcutsList: {
    gap: 10,
    marginBottom: 16,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  shortcutSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  taskTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  taskStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
  },
  taskDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dueText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  progressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  progressBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0866C6',
  },
});

export default StaffTasksScreen;
