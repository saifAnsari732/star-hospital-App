import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { ref, set as rtdbSet } from 'firebase/database';
import { firestoreDb, firebaseRtdb, isFirebaseConfigured } from '../config/firebase';
import type { Appointment, AppointmentVitals } from '../types/appointment';
import type { OPDToken } from '../types/opdToken';
import type { Prescription } from '../types/prescription';
import { mockAppointments } from '../fixtures/mockAppointments';
import { mockOpdTokens } from '../fixtures/mockOpdTokens';
import { mockPrescriptions } from '../fixtures/mockPrescriptions';
import logger from '../utils/logger';

class FirebaseRealtimeDbService {
  // Helper to sync clean JSON objects to Firebase Realtime Database
  private async syncToRtdb(path: string, data: any): Promise<void> {
    if (!firebaseRtdb || typeof (firebaseRtdb as any).app === 'undefined') return;
    try {
      const dbRef = ref(firebaseRtdb, path);
      // Remove any undefined values
      const cleanData = JSON.parse(JSON.stringify(data));
      await rtdbSet(dbRef, {
        ...cleanData,
        _syncedAt: new Date().toISOString(),
      });
      logger.info('firebaseRealtimeDb', `Realtime DB sync complete at path: ${path}`);
    } catch (err) {
      logger.warn('firebaseRealtimeDb', `RTDB sync skipped for ${path}`, { err });
    }
  }

  // ===========================================================================
  // 1. APPOINTMENTS (Dual Firestore & Realtime DB Sync)
  // ===========================================================================

  async saveAppointment(appointment: Appointment): Promise<Appointment> {
    // 1. Cloud Firestore
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const apptDocRef = doc(
          collection(firestoreDb, 'hospital_appointments'),
          appointment.id
        );
        await setDoc(
          apptDocRef,
          {
            ...appointment,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        logger.info('firebaseRealtimeDb', 'Appointment saved in Firestore', { id: appointment.id });
      } catch (err) {
        logger.warn('firebaseRealtimeDb', 'Firestore appointment save error', { err });
      }
    }

    // 2. Firebase Realtime Database (https://star-f3312-default-rtdb.firebaseio.com)
    void this.syncToRtdb(`hospital_appointments/${appointment.id}`, appointment);

    // 3. Keep in-memory cache synchronized
    const existingIdx = mockAppointments.findIndex((a) => a.id === appointment.id);
    if (existingIdx >= 0) {
      mockAppointments[existingIdx] = { ...appointment };
    } else {
      mockAppointments.unshift({ ...appointment });
    }

    return appointment;
  }

  subscribeAppointments(
    filter: { patientId?: string; doctorId?: string },
    onUpdate: (appointments: Appointment[]) => void
  ): () => void {
    if (!isFirebaseConfigured || !firestoreDb) {
      onUpdate([...mockAppointments]);
      return () => {};
    }

    try {
      const colRef = collection(firestoreDb, 'hospital_appointments');
      let q = query(colRef, limit(50));

      if (filter.patientId) {
        q = query(colRef, where('patientId', '==', filter.patientId), limit(50));
      } else if (filter.doctorId) {
        q = query(colRef, where('doctorId', '==', filter.doctorId), limit(50));
      }

      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteAppointments: Appointment[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              remoteAppointments.push({
                ...d,
                id: docSnap.id,
              } as Appointment);
            });
            onUpdate(remoteAppointments);
          } else {
            onUpdate([...mockAppointments]);
          }
        },
        (error) => {
          logger.warn('firebaseRealtimeDb', 'Firestore appointment subscription error', { error });
          onUpdate([...mockAppointments]);
        }
      );
    } catch {
      onUpdate([...mockAppointments]);
      return () => {};
    }
  }

  // ===========================================================================
  // 2. OPD TOKENS & QUEUE (Dual Firestore & Realtime DB Sync)
  // ===========================================================================

  async saveOpdToken(token: OPDToken): Promise<OPDToken> {
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const tokenDocRef = doc(collection(firestoreDb, 'hospital_opd_tokens'), token.id);
        await setDoc(
          tokenDocRef,
          {
            ...token,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        logger.warn('firebaseRealtimeDb', 'Firestore token save error', { err });
      }
    }

    // Realtime Database sync
    void this.syncToRtdb(`hospital_opd_tokens/${token.id}`, token);

    const existingIdx = mockOpdTokens.findIndex((t) => t.id === token.id);
    if (existingIdx >= 0) {
      mockOpdTokens[existingIdx] = { ...token };
    } else {
      mockOpdTokens.push({ ...token });
    }

    return token;
  }

  subscribeDoctorQueue(
    doctorId: string,
    onUpdate: (tokens: OPDToken[]) => void
  ): () => void {
    if (!isFirebaseConfigured || !firestoreDb) {
      onUpdate([...mockOpdTokens]);
      return () => {};
    }

    try {
      const colRef = collection(firestoreDb, 'hospital_opd_tokens');
      const q = query(colRef, where('doctorId', '==', doctorId), limit(50));

      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const tokens: OPDToken[] = [];
            snapshot.forEach((docSnap) => {
              tokens.push({ ...docSnap.data(), id: docSnap.id } as OPDToken);
            });
            onUpdate(tokens);
          } else {
            onUpdate([...mockOpdTokens]);
          }
        },
        () => {
          onUpdate([...mockOpdTokens]);
        }
      );
    } catch {
      onUpdate([...mockOpdTokens]);
      return () => {};
    }
  }

  // ===========================================================================
  // 3. PRESCRIPTIONS (Dual Firestore & Realtime DB Sync)
  // ===========================================================================

  async savePrescription(prescription: Prescription): Promise<Prescription> {
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const rxDocRef = doc(
          collection(firestoreDb, 'hospital_prescriptions'),
          prescription.id
        );
        await setDoc(
          rxDocRef,
          {
            ...prescription,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        logger.warn('firebaseRealtimeDb', 'Firestore prescription save error', { err });
      }
    }

    // Realtime Database sync
    void this.syncToRtdb(`hospital_prescriptions/${prescription.id}`, prescription);

    const existingIdx = mockPrescriptions.findIndex((p) => p.id === prescription.id);
    if (existingIdx >= 0) {
      mockPrescriptions[existingIdx] = { ...prescription };
    } else {
      mockPrescriptions.unshift({ ...prescription });
    }

    return prescription;
  }

  // ===========================================================================
  // 4. CLINICAL VITALS (Dual Firestore & Realtime DB Sync)
  // ===========================================================================

  async saveVitals(patientId: string, vitals: Partial<AppointmentVitals>): Promise<void> {
    const vitalRecord = {
      patientId,
      ...vitals,
      recordedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && firestoreDb) {
      try {
        const vitalsDocRef = doc(collection(firestoreDb, 'hospital_vitals'), `${patientId}-${Date.now()}`);
        await setDoc(vitalsDocRef, {
          ...vitalRecord,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        logger.warn('firebaseRealtimeDb', 'Firestore vitals save error', { err });
      }
    }

    // Realtime Database sync
    void this.syncToRtdb(`hospital_vitals/${patientId}`, vitalRecord);
  }

  // ===========================================================================
  // 5. PATIENT REGISTRATIONS (Dual Firestore & Realtime DB Sync)
  // ===========================================================================

  async savePatientRegistration(account: {
    id: string;
    name: string;
    email: string;
    phone: string;
    gender?: string;
    dob?: string;
    address?: string;
    role: string;
  }): Promise<void> {
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const patDocRef = doc(
          collection(firestoreDb, 'hospital_patient_registrations'),
          account.id
        );
        await setDoc(
          patDocRef,
          {
            ...account,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        logger.warn('firebaseRealtimeDb', 'Firestore registration save error', { err });
      }
    }

    // Realtime Database sync
    void this.syncToRtdb(`hospital_patient_registrations/${account.id}`, account);
  }
}

export const firebaseRealtimeDbService = new FirebaseRealtimeDbService();
export default firebaseRealtimeDbService;
