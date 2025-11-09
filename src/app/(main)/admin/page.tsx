
'use client';

import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useAdmin } from '@/hooks/use-admin';

export default function AdminPage() {
  const { user } = useUser();
  const { isAdmin, isLoading } = useAdmin();

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Admin Controls
        </h1>
        <p className="text-muted-foreground">
          Use this page to manage application settings.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Administrator Role</CardTitle>
          <CardDescription>
            This section shows your current administrator status. Admins can access special features like adding affiliate products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <p className="text-muted-foreground">Checking your admin status...</p>
          ) : isAdmin ? (
            <div className="flex items-center gap-2 text-green-600">
                <Shield className="h-5 w-5" />
                <p className='font-medium'>You are an administrator.</p>
            </div>
          ) : (
             <p className="text-muted-foreground">You are not an administrator. Admin rights must be granted manually via the Firestore console.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
