import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { firestoreDb, isFirebaseConfigured } from '../config/firebase';
import type { Appointment } from '../types/appointment';

export interface ReceptionAppointmentAlert {
  id: string;
  type: 'NEW_APPOINTMENT_BOOKED';
  priority: 'urgent' | 'high';
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientMrn?: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  doctorDepartment: string;
  date: string;
  timeSlot: string;
  mode: 'in_person' | 'video';
  consultationFee?: number;
  status: 'unacknowledged' | 'acknowledged';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

type AlertListener = (alert: ReceptionAppointmentAlert) => void;
type DismissListener = (alertId: string) => void;

const STALE_ALERT_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

class FirebaseAppointmentAlertService {
  private localListeners: Set<AlertListener> = new Set();
  private dismissListeners: Set<DismissListener> = new Set();
  private firestoreUnsubscribe: (() => void) | null = null;
  private recentAlertIds: Set<string> = new Set();
  private isInitialized: boolean = false;

  constructor() {
    this.ensureFirestoreListener();
  }

  /**
   * Initializes real-time listener on Firebase Cloud Firestore 'hospital_reception_alerts'
   */
  ensureFirestoreListener(): void {
    if (this.firestoreUnsubscribe || !isFirebaseConfigured || !firestoreDb) return;

    try {
      const alertsRef = collection(firestoreDb, 'hospital_reception_alerts');
      // Simple equality filter: ultra-fast, no composite index needed
      const q = query(
        alertsRef,
        where('status', '==', 'unacknowledged'),
        limit(15)
      );

      this.firestoreUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const alertId = change.doc.id;

            if (change.type === 'added') {
              if (this.recentAlertIds.has(alertId)) return;
              this.recentAlertIds.add(alertId);

              // Filter out stale alerts older than 15 minutes from previous sessions
              const createdAtMillis =
                data.createdAt?.toMillis?.() ||
                (data.createdAt ? Date.parse(data.createdAt) : Date.now());

              if (Date.now() - createdAtMillis > STALE_ALERT_THRESHOLD_MS) {
                return;
              }

              const alert: ReceptionAppointmentAlert = {
                id: alertId,
                type: 'NEW_APPOINTMENT_BOOKED',
                priority: data.priority || 'urgent',
                appointmentId: data.appointmentId || alertId,
                patientId: data.patientId || 'pat-1',
                patientName: data.patientName || 'Walk-in Patient',
                patientMrn: data.patientMrn || 'P-00101',
                patientPhone: data.patientPhone,
                doctorId: data.doctorId || 'doc-1',
                doctorName: data.doctorName || 'Dr. Amit Sharma',
                doctorDepartment: data.doctorDepartment || 'General Medicine',
                date: data.date || new Date().toISOString().split('T')[0],
                timeSlot: data.timeSlot || '10:00 - 10:20 AM',
                mode: data.mode || 'in_person',
                consultationFee: data.consultationFee,
                status: 'unacknowledged',
                createdAt:
                  data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              };

              this.notifyLocalListeners(alert);
            } else if (change.type === 'removed' || change.type === 'modified') {
              // Alert was acknowledged by another nurse / desk staff
              if (data.status === 'acknowledged' || change.type === 'removed') {
                this.notifyDismissListeners(alertId);
              }
            }
          });
        },
        () => {
          // Graceful handling of network drops or offline transitions
        }
      );
      this.isInitialized = true;
    } catch {
      // Safe fallback
    }
  }

  /**
   * Subscribe reception nurse phone to real-time appointment alerts.
   * Returns an unsubscribe teardown function.
   */
  subscribe(listener: AlertListener): () => void {
    this.ensureFirestoreListener();
    this.localListeners.add(listener);
    return () => {
      this.localListeners.delete(listener);
    };
  }

  /**
   * Subscribe to alert dismissals (when acknowledged remotely by another nurse)
   */
  onDismiss(listener: DismissListener): () => void {
    this.dismissListeners.add(listener);
    return () => {
      this.dismissListeners.delete(listener);
    };
  }

  private notifyLocalListeners(alert: ReceptionAppointmentAlert): void {
    this.localListeners.forEach((listener) => {
      try {
        listener(alert);
      } catch {
        // Safe listener execution
      }
    });
  }

  private notifyDismissListeners(alertId: string): void {
    this.dismissListeners.forEach((listener) => {
      try {
        listener(alertId);
      } catch {
        // Safe listener execution
      }
    });
  }

  /**
   * Broadcasts a new patient appointment booking to Reception & Nurse devices via Cloud Firestore
   */
  async broadcastNewAppointmentAlert(
    appointment: Partial<Appointment>
  ): Promise<ReceptionAppointmentAlert> {
    const alertData: ReceptionAppointmentAlert = {
      id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'NEW_APPOINTMENT_BOOKED',
      priority: 'urgent',
      appointmentId: appointment.id || `apt-${Date.now()}`,
      patientId: appointment.patientId || 'pat-1',
      patientName: appointment.patientName || 'Patient',
      patientMrn: appointment.patientMrn || 'P-00101',
      patientPhone: appointment.patientPhone,
      doctorId: appointment.doctorId || 'doc-1',
      doctorName: appointment.doctorName || 'Dr. Amit Sharma',
      doctorDepartment: appointment.doctorDepartment || 'Cardiology',
      date: appointment.date || new Date().toISOString().split('T')[0],
      timeSlot: appointment.timeSlot || '10:00 - 10:20 AM',
      mode: (appointment.mode as any) || 'in_person',
      consultationFee: appointment.consultationFee,
      status: 'unacknowledged',
      createdAt: new Date().toISOString(),
    };

    // 1. Live Cloud Firestore write
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const alertsRef = collection(firestoreDb, 'hospital_reception_alerts');
        const alertDocRef = doc(alertsRef);
        alertData.id = alertDocRef.id;

        // Add to recent set BEFORE network write to prevent duplicate on local listener
        this.recentAlertIds.add(alertDocRef.id);

        await setDoc(alertDocRef, {
          ...alertData,
          createdAt: serverTimestamp(),
          targetRoles: ['staff', 'nurse', 'receptionist', 'admin'],
        });
      } catch {
        // Fallback: If network drops, local delivery proceeds
      }
    }

    // 2. Immediate local notification for testing or single-device workflows
    this.recentAlertIds.add(alertData.id);
    this.notifyLocalListeners(alertData);

    return alertData;
  }

  /**
   * Mark alert as acknowledged by a staff member (nurse/receptionist)
   */
  async acknowledgeAlert(alertId: string, staffName: string = 'Reception Nurse'): Promise<void> {
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const docRef = doc(firestoreDb, 'hospital_reception_alerts', alertId);
        await updateDoc(docRef, {
          status: 'acknowledged',
          acknowledgedBy: staffName,
          acknowledgedAt: serverTimestamp(),
        });
      } catch {
        // Safe ignore
      }
    }
  }

  /**
   * Trigger a simulated appointment alert for testing audio, vibration & UI
   */
  triggerTestAlert(): ReceptionAppointmentAlert {
    const testAppointment: Partial<Appointment> = {
      id: `apt-test-${Date.now()}`,
      patientId: 'pat-4',
      patientName: 'Kisan Developer (Patient)',
      patientMrn: 'P-00104',
      patientPhone: '9511450914',
      doctorId: 'doc-1',
      doctorName: 'Dr. Amit Sharma',
      doctorDepartment: 'Cardiology (OPD Room 101)',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '11:30 - 11:50 AM',
      mode: 'in_person',
      consultationFee: 500,
    };

    void this.broadcastNewAppointmentAlert(testAppointment);
    return testAppointment as any;
  }
}

export const firebaseAppointmentAlertService = new FirebaseAppointmentAlertService();
export default firebaseAppointmentAlertService;
