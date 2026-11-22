export type OPDTokenStatusType =
  | 'arrived'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'scheduled';

export interface LiveQueueStep {
  tokenNumber: string;
  status: 'completed' | 'current' | 'waiting';
  label?: string;
}

export interface OPDToken {
  id: string;
  tokenNumber: string; // e.g. "A-102"
  patientId: string;
  patientName: string;
  patientMrn?: string;
  doctorId: string;
  doctorName: string;
  department: string;
  servingToken: string; // e.g. "A-101"
  queuePosition: number; // e.g. 2
  estimatedWaitMinutes: number; // e.g. 15
  status: 'arrived' | 'in_consultation' | 'completed' | 'cancelled';
  liveSteps: LiveQueueStep[];
  generatedAt: string;
  roomNo?: string;
  consultStartedAt?: string;
  completedAt?: string;
  isPaid?: boolean;
  paymentAmount?: number;
  paymentId?: string;
}

export interface OpdTokenStatus extends OPDToken {
  tokenId?: string;
  rawTokenNo?: number;
  currentServingToken?: string | null;
  queuePositionAhead?: number;
  trackerStep?: 1 | 2 | 3; // 1: Token Issued / Arrived, 2: In Consultation, 3: Completed
}

export interface DoctorQueueView {
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  totalTokens: number;
  waitingCount: number;
  inConsultationCount: number;
  completedCount: number;
  currentServingToken: string | null;
  tokens: OPDToken[];
}

export interface GenerateTokenRequest {
  patientId: string;
  doctorId: string;
  department?: string;
  visitType?: 'first_visit' | 'follow_up' | 'emergency';
}

export interface CallNextTokenRequest {
  doctorId: string;
  tokenId?: string;
}
