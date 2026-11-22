import apiClient, { withMockFallback } from './apiClient';
import { firebaseRealtimeDbService } from './firebaseRealtimeDbService';
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
          nextWaiting.status = 'in_consultation';
          nextWaiting.consultStartedAt = new Date().toISOString();
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
   * Complete current consultation for a token
   */
  async completeToken(tokenId: string): Promise<void> {
    return withMockFallback(
      () =>
        apiClient.post<void>(`/api/v1/opd/tokens/${tokenId}/complete`),
      () => {
        const token = mockOpdTokens.find((t) => t.id === tokenId);
        if (token) {
          token.status = 'completed';
          token.completedAt = new Date().toISOString();
          void firebaseRealtimeDbService.saveOpdToken(token);
        }
      }
    );
  },
};

export default opdTokenService;
