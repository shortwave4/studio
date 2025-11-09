
'use client';

import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';
import { useAdmin } from '@/hooks/use-admin';

export default function AdminPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { isAdmin, isLoading } = useAdmin();

  const handleMakeAdmin = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in.',
      });
      return;
    }
    const adminRef = doc(firestore, 'roles_admin', user.uid);
    // We can use an empty object because we only check for the document's existence
    setDocumentNonBlocking(adminRef, {});

    toast({
      title: 'Success!',
      description: 'You have been granted admin privileges. Please refresh the page.',
    });
  };

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
            Grant yourself administrator privileges to access special features
            like adding affiliate products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <p className="text-muted-foreground">Checking your admin status...</p>
          ) : isAdmin ? (
            <div className="flex items-center gap-2 text-green-600">
                <Shield className="h-5 w-5" />
                <p className='font-medium'>You are already an administrator.</p>
            </div>
          ) : (
            <Button onClick={handleMakeAdmin}>Make Me Admin</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
