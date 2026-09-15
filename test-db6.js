import { initializeApp } from 'firebase/app';
import { getFirestore, collectionGroup, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ngo-web-a7c3e",
  appId: "1:109165857470:web:be6eb49980d3ed6c10acef",
  apiKey: "AIzaSyDpngGJfJhp3iKJ3BvqO1odNZeAYCZeDpI",
  authDomain: "ngo-web-a7c3e.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-idforge-b0237242-cdab-405b-8741-a1d7fee55089");

async function check() {
  const q = collectionGroup(db, 'members');
  const snap = await getDocs(q);
  console.log('CollectionGroup members:', snap.size);
}
check().catch(console.error).finally(() => process.exit(0));
