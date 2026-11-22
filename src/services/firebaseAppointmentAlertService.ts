import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
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

class FirebaseAppointmentAlertService {
  private localListeners: Set<AlertListener> = new Set();
  private firestoreUnsubscribe: (() => void) | null = null;
  private recentAlertIds: Set<string> = new Set();

  constructor() {
    this.initFirestoreListener();
  }

  /**
   * Initializes real-time listener on Firebase Firestore 'hospital_reception_alerts'
   */
  private initFirestoreListener(): void {
    if (!isFirebaseConfigured || !firestoreDb) return;

    try {
      const alertsRef = collection(firestoreDb, 'hospital_reception_alerts');
      const q = query(
        alertsRef,
        where('status', '==', 'unacknowledged'),
        limit(10)
      );

      this.firestoreUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const alertId = change.doc.id;

              if (this.recentAlertIds.has(alertId)) return;
              this.recentAlertIds.add(alertId);

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
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              };

              this.notifyLocalListeners(alert);
            }
          });
        },
        () => {
          // Fallback gracefully on firestore connection drops
        }
      );
    } catch {
      // Ignore initial Firestore setup errors
    }
  }

  /**
   * Subscribe nurse or receptionist phone to real-time appointment alerts
   */
  subscribe(listener: AlertListener): () => void {
    this.localListeners.add(listener);
    return () => {
      this.localListeners.delete(listener);
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

  /**
   * Broadcasts a new patient appointment booking to Reception & Nurse devices via Firebase Firestore
   */
  async broadcastNewAppointmentAlert(
    appointment: Partial<Appointment>
  ): Promise<ReceptionAppointmentAlert> {
    const alertId = `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const alertData: ReceptionAppointmentAlert = {
      id: alertId,
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

    // 1. Write to real Firebase Firestore if available
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const alertsRef = collection(firestoreDb, 'hospital_reception_alerts');
        const docRef = await addDoc(alertsRef, {
          ...alertData,
          createdAt: serverTimestamp(),
          targetRoles: ['staff', 'nurse', 'receptionist', 'admin'],
        });
        alertData.id = docRef.id;
      } catch {
        // Fallback: Continue local delivery
      }
    }

    // 2. Deliver immediately to active listeners on this phone / session
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
        // Ignore
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
