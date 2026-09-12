import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ngo-web-a7c3e",
  appId: "1:109165857470:web:be6eb49980d3ed6c10acef",
  apiKey: "AIzaSyDpngGJfJhp3iKJ3BvqO1odNZeAYCZeDpI",
  authDomain: "ngo-web-a7c3e.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-idforge-b0237242-cdab-405b-8741-a1d7fee55089");

async function fix() {
  const docRef = doc(db, 'users', '6a3a10qFoBbK4AI6pyFiMDpMW6h2');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    if (data.organization && data.organization.logoUrl && data.organization.logoUrl.includes('data:image/svg')) {
      data.organization.logoUrl = '/daksheba.jpg';
      await updateDoc(docRef, { organization: data.organization });
      console.log('Fixed in Firestore!');
    } else {
      console.log('Already fixed or not SVG');
    }
  }
  process.exit(0);
}
fix();
