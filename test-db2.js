import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "ngo-web-a7c3e",
  appId: "1:109165857470:web:be6eb49980d3ed6c10acef",
  apiKey: "AIzaSyDpngGJfJhp3iKJ3BvqO1odNZeAYCZeDpI",
  authDomain: "ngo-web-a7c3e.firebaseapp.com",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-idforge-b0237242-cdab-405b-8741-a1d7fee55089");

async function check() {
  const mems = await getDocs(collection(db, 'users', 'public-workspace', 'members'));
  console.log('public-workspace members:', mems.size);
  mems.forEach(m => console.log(' Member:', m.data().memberId));
}
check().catch(console.error).finally(() => process.exit(0));
