'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getSuggestedUsers } from '@/lib/actions';
import type { UserProfile } from '@/types';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function DiscoverUsers() {
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    async function fetchUsers() {
      // In a real app, you'd get the user's location from their profile
      // or use the browser's Geolocation API.
      const userLocation = {
        latitude: 34.0522,
        longitude: -118.2437,
      };

      try {
        setLoading(true);
        const suggestedUsers = await getSuggestedUsers(userLocation);
        setUsers(suggestedUsers);
      } catch (e) {
        setError('Failed to load suggestions. Please try again later.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleStartChat = () => {
    router.push('/chat');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="flex flex-col text-center">
            <div className="relative flex flex-col items-center justify-center pt-16 pb-8">
              <Skeleton className="h-24 w-24 rounded-full absolute -top-12" />
            </div>
            <CardContent className="flex-grow bg-background rounded-b-lg p-6 pt-10">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full mx-auto mt-2" />
              <Skeleton className="h-4 w-1/2 mx-auto mt-1" />
            </CardContent>
            <CardFooter className="bg-background rounded-b-lg p-6 pt-0">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center">{error}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
      {users.map((user) => (
        <Card
          key={user.userId}
          className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden bg-card"
        >
          <div className="relative h-24 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent">
             <div className='absolute -bottom-12 left-1/2 -translate-x-1/2'>
                <Avatar className="w-24 h-24 border-4 border-card bg-background ring-1 ring-border">
                    <AvatarImage
                    src={`https://picsum.photos/seed/${user.userId}/200/200`}
                    alt={user.name}
                    data-ai-hint="person portrait"
                    />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
             </div>
          </div>
          
          <CardContent className="pt-16 pb-6 px-6">
            <h3 className="font-headline text-xl font-bold">{user.name}</h3>
            <p className="text-muted-foreground mt-1 text-sm h-10">{user.bio}</p>
          </CardContent>
          <CardFooter className="px-6 pb-6">
            <Button className="w-full" variant="outline" onClick={handleStartChat}>
              <MessageSquarePlus className="mr-2 h-4 w-4" /> Start Chat
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
