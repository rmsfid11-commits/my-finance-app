import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const cfg = {
  apiKey: import.meta.env.VITE_FB_KEY,
  authDomain: import.meta.env.VITE_FB_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT,
  storageBucket: import.meta.env.VITE_FB_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER,
  appId: import.meta.env.VITE_FB_APP,
};

export const firebaseEnabled = !!cfg.apiKey;
let auth = null, db = null, googleProvider = null;
if (firebaseEnabled) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
}
export { auth, db, googleProvider };
