import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { subscribeToBookmarks, initializeUserDoc } from '../lib/sync';

export function SyncManager() {
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      initializeUserDoc(user.uid);
      const unsubscribe = subscribeToBookmarks(user.uid);
      return () => unsubscribe();
    }
  }, [user]);

  return null;
}
