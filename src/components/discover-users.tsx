'use client';

import * as React from 'react';
import { getSuggestedUsers } from '@/lib/actions';
import type { UserProfile } from '@/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DiscoverUsers() {
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="flex flex-col text-center">
            <CardHeader className="items-center">
              <Skeleton className="h-24 w-24 rounded-full" />
            </CardHeader>
            <CardContent className="flex-grow">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-full mx-auto mt-2" />
              <Skeleton className="h-4 w-1/2 mx-auto mt-1" />
            </CardContent>
            <CardFooter>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {users.map((user) => (
        <Card
          key={user.userId}
          className="flex flex-col text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          <CardHeader className="items-center">
            <Avatar className="w-24 h-24 border-4 border-background ring-2 ring-primary">
              <AvatarImage
                src={`https://picsum.photos/seed/${user.userId}/200/200`}
                alt={user.name}
                data-ai-hint="person portrait"
              />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardTitle className="font-headline text-xl">{user.name}</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">{user.bio}</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              <MessageSquarePlus className="mr-2 h-4 w-4" /> Start Chat
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
