import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

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

async function checkDocs() {
  const snap = await getDocs(query(collection(db, 'hospital_reception_alerts'), limit(5)));
  console.log('Total docs found:', snap.size);
  snap.forEach(d => {
    const data = d.data();
    console.log(d.id, '->', {
      patientName: data.patientName,
      doctorName: data.doctorName,
      status: data.status,
      createdAtType: typeof data.createdAt,
      createdAt: data.createdAt,
      hasToMillis: typeof data.createdAt?.toMillis,
    });
  });
  process.exit(0);
}

checkDocs().catch(err => {
  console.error(err);
  process.exit(1);
});
