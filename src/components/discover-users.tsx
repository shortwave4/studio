'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { suggestUsersByLocation } from '@/ai/flows/suggest-users-by-location';
import { useToast } from '@/hooks/use-toast';

export default function DiscoverUsers() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [suggestedUsers, setSuggestedUsers] = React.useState<UserProfile[]>([]);
  const [isSuggesting, setIsSuggesting] = React.useState(true);

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, isLoading: loading, error } = useCollection<UserProfile>(usersCollectionRef);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const suggestions = await suggestUsersByLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            // Let's merge AI suggestions with real users to make it more realistic
            const suggestedIds = suggestions.map(s => s.userId);
            const realSuggestedUsers = users?.filter(u => suggestedIds.includes(u.id)) || [];
            
            // To make sure we always have some users, we'll combine them.
            // In a real app, the AI would probably get users from the DB directly.
            const combined = [...realSuggestedUsers, ...suggestions.filter(s => !realSuggestedUsers.find(r => r.id === s.userId))];
            
            setSuggestedUsers(combined.slice(0, 8)); // Limit to 8 for demo
          } catch (aiError) {
            console.error("AI suggestion failed:", aiError);
            toast({
              variant: "destructive",
              title: "AI Suggestion Failed",
              description: "Could not fetch location-based suggestions. Showing all users.",
            });
            setSuggestedUsers(users || []);
          } finally {
            setIsSuggesting(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            variant: "destructive",
            title: "Location Access Denied",
            description: "Showing all users as location access was denied.",
          });
          setSuggestedUsers(users || []);
          setIsSuggesting(false);
        }
      );
    } else {
        toast({
            title: "Geolocation not supported",
            description: "Showing all users as geolocation is not supported by your browser.",
        });
        setSuggestedUsers(users || []);
        setIsSuggesting(false);
    }
  }, [users, toast]);


  const handleStartChat = () => {
    router.push('/chat');
  };

  const isLoading = loading || isSuggesting;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {Array.from({ length: 8 }).map((_, i) => (
           <Card
            key={i}
            className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden bg-card"
          >
            <div className="relative h-24 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent">
               <div className='absolute -bottom-12 left-1/2 -translate-x-1/2'>
                  <Skeleton className="w-24 h-24 rounded-full border-4 border-card bg-background ring-1 ring-border"/>
               </div>
            </div>
            
            <CardContent className="pt-16 pb-6 px-6">
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-10 w-full mx-auto mt-2" />
            </CardContent>
            <CardFooter className="px-6 pb-6">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center">Failed to load users. Please check your security rules.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
      {suggestedUsers.map((user) => (
        <Card
          key={user.id}
          className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden bg-card"
        >
          <div className="relative h-24 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent">
             <div className='absolute -bottom-12 left-1/2 -translate-x-1/2'>
                <Avatar className="w-24 h-24 border-4 border-card bg-background ring-1 ring-border">
                    <AvatarImage
                    src={`https://picsum.photos/seed/${user.id}/200/200`}
                    alt={user.name}
                    data-ai-hint="person portrait"
                    />
                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
             </div>
          </div>
          
          <CardContent className="pt-16 pb-6 px-6">
            <h3 className="font-headline text-xl font-bold">{user.name}</h3>
            <p className="text-muted-foreground mt-1 text-sm h-10">{user.bio || 'Loves connecting with new people.'}</p>
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
