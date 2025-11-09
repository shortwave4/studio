
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const adminRef = useMemoFirebase(() => (user ? doc(firestore, 'roles_admin', user.uid) : null), [user, firestore]);
  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminRef);

  const isAdmin = !!adminDoc;
  const isLoading = isUserLoading || (user ? isAdminDocLoading : false);

  return { isAdmin, isLoading };
}
