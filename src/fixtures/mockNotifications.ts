import { NotificationItem } from '../types/notification';

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'OPD Token Generated',
    body: 'Your token number is A-102 for Dr. Amit Sharma (General Physician). Current serving: A-101.',
    category: 'opd_token',
    read: false,
    createdAt: '2026-11-14T09:05:00Z',
    dataPayload: {
      tokenId: 'tok-102',
      tokenNumber: 'A-102',
      doctorId: 'doc-1',
    },
  },
  {
    id: 'notif-2',
    title: 'Appointment Reminder',
    body: 'You have an upcoming consultation with Dr. Amit Sharma tomorrow at 10:30 AM.',
    category: 'appointment',
    read: false,
    createdAt: '2026-11-14T08:00:00Z',
    dataPayload: {
      appointmentId: 'apt-1',
      doctorId: 'doc-1',
    },
  },
  {
    id: 'notif-3',
    title: 'Diagnostic Report Ready',
    body: 'Your Complete Blood Count (CBC) with ESR report has been verified by the lab.',
    category: 'lab_report',
    read: true,
    createdAt: '2026-11-13T17:30:00Z',
    dataPayload: {
      reportId: 'rep-1',
      testName: 'Complete Blood Count (CBC)',
    },
  },
  {
    id: 'notif-4',
    title: 'New Prescription Available',
    body: 'Prescription RX-2026-0028 has been issued by Dr. Priya Mehta.',
    category: 'prescription',
    read: true,
    createdAt: '2026-10-14T11:00:00Z',
    dataPayload: {
      prescriptionId: 'rx-2',
      prescriptionNumber: 'RX-2026-0028',
    },
  },
  {
    id: 'notif-5',
    title: 'Payment Receipt Confirmed',
    body: 'Payment of PKR 4,700 received for Invoice INV-10019 via Online Banking.',
    category: 'billing',
    read: true,
    createdAt: '2026-10-14T10:31:00Z',
    dataPayload: {
      invoiceId: 'inv-2',
      invoiceNumber: 'INV-10019',
    },
  },
];
