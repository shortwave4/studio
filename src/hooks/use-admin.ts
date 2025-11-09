
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const ADMIN_EMAIL = 'fahadkhanamrohivi@gmail.com';

export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const adminRef = useMemoFirebase(() => (user ? doc(firestore, 'roles_admin', user.uid) : null), [user, firestore]);
  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminRef);

  const isAdminByDoc = !!adminDoc;
  const isAdminByEmail = user?.email === ADMIN_EMAIL;
  
  const isAdmin = isAdminByDoc || isAdminByEmail;
  const isLoading = isUserLoading || (user ? isAdminDocLoading : false);

  return { isAdmin, isLoading };
}
