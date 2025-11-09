
'use client';

import { useUser } from '@/firebase';

const ADMIN_EMAIL = 'fahadkhanamrohivi@gmail.com';

export function useAdmin() {
  const { user, isUserLoading } = useUser();

  const isAdmin = user?.email === ADMIN_EMAIL;
  const isLoading = isUserLoading;

  return { isAdmin, isLoading };
}
