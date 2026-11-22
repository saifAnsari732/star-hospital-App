import apiClient, { withMockFallback } from './apiClient';
import { firebaseRealtimeDbService } from './firebaseRealtimeDbService';
import { voiceQueueAnnouncementService } from './voiceQueueAnnouncementService';
import type { Appointment } from '../types/appointment';
import {
  OPDToken,
  DoctorQueueView,
  GenerateTokenRequest,
} from '../types/opdToken';
import {
  mockCurrentOpdToken,
  mockOpdTokens,
  mockDoctorQueueViews,
} from '../fixtures/mockOpdTokens';
import { mockDoctors } from '../fixtures/mockDoctors';
import { mockPatients } from '../fixtures/mockPatients';

export interface PatientPaymentLedgerItem {
  id: string;
  patientId: string;
  patientMrn: string;
  patientName: string;
  tokenId?: string;
  tokenNumber?: string;
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  department: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'refunded';
  paymentMethod: string;
  transactionRef: string;
  timestamp: string;
  description: string;
}

export const mockPaymentLedger: PatientPaymentLedgerItem[] = [
  {
    id: 'PAY-1001',
    patientId: 'pat-1',
    patientMrn: 'P-00102',
    patientName: 'Ali Khan',
    tokenId: 'tok-102',
    tokenNumber: 'A-102',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    amount: 500,
    currency: 'INR',
    status: 'paid',
    paymentMethod: 'UPI / GPay',
    transactionRef: 'UPI-9823481230',
    timestamp: '2026-11-22T08:30:00Z',
    description: 'OPD Consultation Fee',
  },
  {
    id: 'PAY-1002',
    patientId: 'pat-3',
    patientMrn: 'P-00104',
    patientName: 'Mohammed Bilal',
    tokenId: 'tok-101',
    tokenNumber: 'A-101',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    amount: 500,
    currency: 'INR',
    status: 'paid',
    paymentMethod: 'PhonePe',
    transactionRef: 'UPI-7712398412',
    timestamp: '2026-11-22T08:15:00Z',
    description: 'OPD Consultation Fee',
  },
  {
    id: 'PAY-1003',
    patientId: 'pat-2',
    patientMrn: 'P-00103',
    patientName: 'Sarah Ahmed',
    tokenId: 'tok-103',
    tokenNumber: 'A-103',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    amount: 500,
    currency: 'INR',
    status: 'paid',
    paymentMethod: 'Debit Card',
    transactionRef: 'CARD-4112-XXXX',
    timestamp: '2026-11-22T08:45:00Z',
    description: 'OPD Consultation Fee',
  },
  {
    id: 'PAY-1004',
    patientId: 'pat-4',
    patientMrn: 'P-00105',
    patientName: 'Fatima Noor',
    tokenId: 'tok-104',
    tokenNumber: 'A-104',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    amount: 500,
    currency: 'INR',
    status: 'paid',
    paymentMethod: 'Cash Desk',
    transactionRef: 'REC-CSH-098',
    timestamp: '2026-11-22T08:50:00Z',
    description: 'OPD Consultation Fee',
  },
];

export const opdTokenService = {
  /**
   * Issue a new OPD Token for patient walk-in or appointment check-in
   */
  async generateToken(req: GenerateTokenRequest): Promise<OPDToken> {
    return withMockFallback(
      () =>
        apiClient.post<OPDToken>('/api/v1/opd/tokens/generate', req),
      () => {
        const doc =
          mockDoctors.find((d) => d.id === req.doctorId) || mockDoctors[0];
        const pat =
          mockPatients.find((p) => p.id === req.patientId) || mockPatients[0];

        // Monotonic next token generation
        const nextNum = mockOpdTokens.length + 98;
        const tokenNumber = `A-${nextNum}`;

        // Compute waiting queue position and wait minutes
        const waitingTokens = mockOpdTokens.filter((t) => t.status === 'arrived');
        const queuePosition = waitingTokens.length + 1;
        const estimatedWaitMinutes = queuePosition * 15;

        const currentServing =
          mockOpdTokens.find((t) => t.status === 'in_consultation')?.tokenNumber ||
          'A-101';

        const newToken: OPDToken = {
          id: `tok-${Date.now()}`,
          tokenNumber,
          patientId: pat.id,
          patientName: pat.name,
          patientMrn: pat.mrn,
          doctorId: doc.id,
          doctorName: doc.name,
          department: doc.department,
          servingToken: currentServing,
          queuePosition,
          estimatedWaitMinutes,
          status: 'arrived',
          liveSteps: [
            { tokenNumber: 'A-100', status: 'completed', label: 'Completed' },
            { tokenNumber: currentServing, status: 'current', label: 'Serving' },
            { tokenNumber, status: 'waiting', label: 'Your Token' },
          ],
          generatedAt: new Date().toISOString(),
          roomNo: doc.roomNo || 'OPD Room 101',
        };

        mockOpdTokens.push(newToken);
        void firebaseRealtimeDbService.saveOpdToken(newToken);
        return newToken;
      }
    );
  },

  /**
   * Fetch live status and queue position for a token
   */
  async fetchTokenStatus(tokenIdentifier: string): Promise<OPDToken> {
    return withMockFallback(
      () =>
        apiClient.get<OPDToken>(`/api/v1/opd/tokens/${tokenIdentifier}`),
      () => {
        const found = mockOpdTokens.find(
          (t) => t.id === tokenIdentifier || t.tokenNumber === tokenIdentifier
        );
        return found || mockCurrentOpdToken;
      }
    );
  },

  /**
   * Get the active queue for a doctor (used on Doctor Dashboard & Queue Caller screen)
   */
  async getDoctorQueue(
    doctorId: string = 'doc-1',
    date: string = '2026-11-14'
  ): Promise<DoctorQueueView> {
    return withMockFallback(
      () =>
        apiClient.get<DoctorQueueView>(`/api/v1/opd/queue/${doctorId}`, {
          params: { date },
        } as any),
      () => {
        const doc =
          mockDoctors.find((d) => d.id === doctorId) || mockDoctors[0];
        const tokens = mockOpdTokens.filter((t) => t.doctorId === doctorId);

        const waiting = tokens.filter((t) => t.status === 'arrived').length;
        const inConsultation = tokens.filter(
          (t) => t.status === 'in_consultation'
        ).length;
        const completed = tokens.filter((t) => t.status === 'completed').length;
        const currentServing =
          tokens.find((t) => t.status === 'in_consultation')?.tokenNumber ||
          null;

        return {
          doctorId: doc.id,
          doctorName: doc.name,
          department: doc.department,
          date,
          totalTokens: tokens.length,
          waitingCount: waiting,
          inConsultationCount: inConsultation,
          completedCount: completed,
          currentServingToken: currentServing,
          tokens,
        };
      }
    );
  },

  /**
   * Advance queue: Call next patient into doctor consultation room
   */
  async callNextToken(doctorId: string = 'doc-1'): Promise<OPDToken | null> {
    return withMockFallback(
      () =>
        apiClient.post<OPDToken>(`/api/v1/opd/queue/${doctorId}/call-next`),
      () => {
        // Complete current in_consultation token
        const currentServing = mockOpdTokens.find(
          (t) => t.doctorId === doctorId && t.status === 'in_consultation'
        );
        if (currentServing) {
          currentServing.status = 'completed';
          currentServing.completedAt = new Date().toISOString();
          void firebaseRealtimeDbService.saveOpdToken(currentServing);
        }

        // Find next waiting token
        const nextWaiting = mockOpdTokens.find(
          (t) => t.doctorId === doctorId && t.status === 'arrived'
        );

        if (nextWaiting) {
          const now = Date.now();
          const TEN_MINUTES_MS = 10 * 60 * 1000;
          nextWaiting.status = 'in_consultation';
          nextWaiting.consultStartedAt = new Date(now).toISOString();
          nextWaiting.expiresAt = new Date(now + TEN_MINUTES_MS).toISOString();
          nextWaiting.consultDurationLimitSeconds = 600; // 10 minutes
          nextWaiting.servingToken = nextWaiting.tokenNumber;
          nextWaiting.queuePosition = 1;
          nextWaiting.estimatedWaitMinutes = 0;

          // Re-evaluate subsequent waiting positions
          let pos = 2;
          mockOpdTokens
            .filter((t) => t.doctorId === doctorId && t.status === 'arrived')
            .forEach((t) => {
              t.servingToken = nextWaiting.tokenNumber;
              t.queuePosition = pos;
              t.estimatedWaitMinutes = pos * 15;
              pos++;
              void firebaseRealtimeDbService.saveOpdToken(t);
            });

          void firebaseRealtimeDbService.saveOpdToken(nextWaiting);
          return nextWaiting;
        }

        return null;
      }
    );
  },

  /**
   * Complete current consultation for a token (manual or 10-min auto-expire)
   */
  async completeToken(
    tokenId: string,
    reason: 'manual' | 'auto_expired' = 'manual'
  ): Promise<void> {
    return withMockFallback(
      () =>
        apiClient.post<void>(`/api/v1/opd/tokens/${tokenId}/complete`, { reason }),
      () => {
        const token = mockOpdTokens.find((t) => t.id === tokenId);
        if (token) {
          token.status = 'completed';
          token.completedAt = new Date().toISOString();
          if (reason === 'auto_expired') {
            token.autoExpired = true;
          }
          void firebaseRealtimeDbService.saveOpdToken(token);
        }
      }
    );
  },

  /**
   * Check and auto-expire any active token that exceeds the 10-minute timer limit
   */
  async checkAndExpireStaleTokens(): Promise<OPDToken[]> {
    const now = Date.now();
    const expired: OPDToken[] = [];
    mockOpdTokens.forEach((tok) => {
      if (tok.status === 'in_consultation') {
        const start = tok.consultStartedAt ? Date.parse(tok.consultStartedAt) : null;
        const expires = tok.expiresAt
          ? Date.parse(tok.expiresAt)
          : start
          ? start + 10 * 60 * 1000
          : null;

        if (expires && now >= expires) {
          tok.status = 'completed';
          tok.completedAt = new Date().toISOString();
          tok.autoExpired = true;
          void firebaseRealtimeDbService.saveOpdToken(tok);
          expired.push(tok);
        }
      }
    });
    return expired;
  },

  /**
   * Automatically generate an OPD Token & register consultation payment when appointment is booked
   */
  async generateTokenForAppointment(appointment: Appointment): Promise<OPDToken> {
    const doc = mockDoctors.find((d) => d.id === appointment.doctorId) || mockDoctors[0];
    const pat = mockPatients.find((p) => p.id === appointment.patientId) || mockPatients[0];

    const nextNum = mockOpdTokens.length + 98;
    const tokenNumber = `A-${nextNum}`;
    const waitingTokens = mockOpdTokens.filter((t) => t.status === 'arrived');
    const queuePosition = waitingTokens.length + 1;
    const estimatedWaitMinutes = queuePosition * 10;
    const currentServing =
      mockOpdTokens.find((t) => t.status === 'in_consultation')?.tokenNumber || 'A-101';

    const fee = appointment.consultationFee || doc.consultationFee || 500;
    const paymentId = `PAY-${Date.now()}`;

    const newToken: OPDToken = {
      id: `tok-${Date.now()}`,
      tokenNumber,
      patientId: appointment.patientId || pat.id,
      patientName: appointment.patientName || pat.name,
      patientMrn: appointment.patientMrn || pat.mrn,
      doctorId: doc.id,
      doctorName: doc.name,
      department: doc.department,
      servingToken: currentServing,
      queuePosition,
      estimatedWaitMinutes,
      status: 'arrived',
      liveSteps: [
        { tokenNumber: 'A-100', status: 'completed', label: 'Completed' },
        { tokenNumber: currentServing, status: 'current', label: 'Serving' },
        { tokenNumber, status: 'waiting', label: 'Your Token' },
      ],
      generatedAt: new Date().toISOString(),
      roomNo: doc.roomNo || 'OPD Room 101',
      isPaid: true,
      paymentAmount: fee,
      paymentId,
    };

    mockOpdTokens.push(newToken);
    void firebaseRealtimeDbService.saveOpdToken(newToken);

    // Record payment automatically under Patient ID
    const paymentItem: PatientPaymentLedgerItem = {
      id: paymentId,
      patientId: newToken.patientId,
      patientMrn: newToken.patientMrn || 'N/A',
      patientName: newToken.patientName,
      tokenId: newToken.id,
      tokenNumber: newToken.tokenNumber,
      appointmentId: appointment.id,
      doctorId: doc.id,
      doctorName: doc.name,
      department: doc.department,
      amount: fee,
      currency: 'INR',
      status: 'paid',
      paymentMethod: 'UPI / Online Auto-Pay',
      transactionRef: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      description: `OPD Appointment Consultation Fee (${doc.name})`,
    };

    mockPaymentLedger.unshift(paymentItem);
    void firebaseRealtimeDbService.savePatientPayment(paymentItem);

    return newToken;
  },

  /**
   * Retrieve payment history by Patient ID or MRN
   */
  async getPatientPayments(patientId?: string): Promise<PatientPaymentLedgerItem[]> {
    if (!patientId) return [...mockPaymentLedger];
    return mockPaymentLedger.filter(
      (p) => p.patientId === patientId || p.patientMrn === patientId
    );
  },

  /**
   * Retrieve all payments for hospital reception & accounts ledger
   */
  async getAllPayments(): Promise<PatientPaymentLedgerItem[]> {
    return [...mockPaymentLedger];
  },
};

export default opdTokenService;
