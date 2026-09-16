import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ngo-web-a7c3e",
  appId: "1:109165857470:web:be6eb49980d3ed6c10acef",
  apiKey: "AIzaSyDpngGJfJhp3iKJ3BvqO1odNZeAYCZeDpI",
  authDomain: "ngo-web-a7c3e.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-idforge-b0237242-cdab-405b-8741-a1d7fee55089");

async function check() {
  const d = await getDoc(doc(db, 'users', '6a3a10qFoBbK4AI6pyFiMDpMW6h2'));
  console.log('User 6a3a10qFoBbK4AI6pyFiMDpMW6h2:', d.data()?.organization);
}
check().catch(console.error).finally(() => process.exit(0));
