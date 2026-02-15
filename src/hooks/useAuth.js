import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firebaseEnabled } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseEnabled);
  useEffect(() => {
    if (!firebaseEnabled) return;
    return onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
  }, []);
  return { user, loading };
}
