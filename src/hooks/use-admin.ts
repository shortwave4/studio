
'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const adminRef = user ? doc(firestore, 'roles_admin', user.uid) : null;
  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminRef);

  const isAdmin = !!adminDoc;
  const isLoading = isUserLoading || (user ? isAdminDocLoading : false);

  return { isAdmin, isLoading };
}
