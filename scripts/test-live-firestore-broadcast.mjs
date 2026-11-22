import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDBIo4nBnE7tJGmROpqz2ZhZCjKehW5Z_I",
  authDomain: "star-f3312.firebaseapp.com",
  projectId: "star-f3312",
  storageBucket: "star-f3312.firebasestorage.app",
  messagingSenderId: "374748056859",
  appId: "1:374748056859:web:46ff4749ad354ed875d7be",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log('Sending live appointment alert to Firestore...');
  const docRef = await addDoc(collection(db, 'hospital_reception_alerts'), {
    type: 'NEW_APPOINTMENT_BOOKED',
    priority: 'urgent',
    appointmentId: `apt-remote-${Date.now()}`,
    patientId: 'pat-999',
    patientName: 'Kavita Singh (Patient)',
    patientMrn: 'P-99042',
    patientPhone: '+91 98765 43210',
    doctorId: 'doc-2001',
    doctorName: 'Dr. Amit Sharma',
    doctorDepartment: 'Cardiology (OPD Room 101)',
    date: '2026-11-22',
    timeSlot: '12:00 - 12:20 PM',
    mode: 'in_person',
    consultationFee: 500,
    status: 'unacknowledged',
    createdAt: serverTimestamp(),
    targetRoles: ['staff', 'nurse', 'receptionist', 'admin'],
  });

  console.log('ALERT_DOC_CREATED_ID:', docRef.id);
  process.exit(0);
}

run().catch((err) => {
  console.error('Error creating doc:', err);
  process.exit(1);
});
