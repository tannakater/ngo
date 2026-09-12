import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ngo-web-a7c3e",
  appId: "1:109165857470:web:be6eb49980d3ed6c10acef",
  apiKey: "AIzaSyDpngGJfJhp3iKJ3BvqO1odNZeAYCZeDpI",
  authDomain: "ngo-web-a7c3e.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-idforge-b0237242-cdab-405b-8741-a1d7fee55089");

async function run() {
  try {
    const docRef = doc(db, 'users', '6a3a10qFoBbK4AI6pyFiMDpMW6h2');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const org = data.organization || {};
      org.logoUrl = '/daksheba.jpg';
      await updateDoc(docRef, { organization: org });
      console.log('Updated logoUrl to /daksheba.jpg');
    }
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
