
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, Query } from 'firebase/firestore';
import * as geofirestore from 'geofirestore';
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
import { useToast } from '@/hooks/use-toast';

export default function DiscoverUsers() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [suggestedUsers, setSuggestedUsers] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const Geofirestore = geofirestore.Geofirestore;

  React.useEffect(() => {
    const fetchNearbyUsers = async (latitude: number, longitude: number) => {
      setIsLoading(true);
      try {
        const geoFirestore = new Geofirestore(collection(firestore, 'users'));
        const radiusInM = 50 * 1000; // 50km
        
        const query = geoFirestore.near({
          center: { latitude, longitude },
          radius: radiusInM / 1000 // geofirestore uses km
        });

        const snapshot = await query.limit(10).get();

        const users: UserProfile[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
          .filter(u => u.id !== user?.uid); // Filter out the current user

        setSuggestedUsers(users);

      } catch (error) {
        console.error("Geofirestore query failed:", error);
        toast({
          variant: "destructive",
          title: "Suggestion Failed",
          description: "Could not fetch location-based suggestions.",
        });
        setSuggestedUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchWithoutLocation = async () => {
        setIsLoading(true);
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, limit(8));
            const querySnapshot = await getDocs(q);
            const users = querySnapshot.docs
                .map(doc => ({id: doc.id, ...doc.data()} as UserProfile))
                .filter(u => u.id !== user?.uid);
            setSuggestedUsers(users);
        } catch (error) {
            console.error("Fetching users failed:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not fetch users.",
            });
        } finally {
            setIsLoading(false);
        }
    };


    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchNearbyUsers(position.coords.latitude, position.coords.longitude);
        },
        (error: GeolocationPositionError) => {
          if (error.code === error.PERMISSION_DENIED) {
            toast({
              variant: 'destructive',
              title: 'Location Access Denied',
              description: 'Showing default user suggestions.',
            });
          } else {
            console.error('Geolocation error:', error.message);
            toast({
              variant: 'destructive',
              title: 'Location Error',
              description: 'Could not retrieve location. Showing default suggestions.',
            });
          }
          fetchWithoutLocation();
        }
      );
    } else {
      toast({
        title: "Geolocation not supported",
        description: "Showing default user suggestions.",
      });
      fetchWithoutLocation();
    }
  }, [user?.uid, firestore, toast, Geofirestore]);


  const handleStartChat = () => {
    router.push('/chat');
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {Array.from({ length: 8 }).map((_, i) => (
           <Card
            key={`skeleton-${i}`}
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
      {suggestedUsers.map((userProfile) => (
        <Card
          key={userProfile.id}
          className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden bg-card"
        >
          <div className="relative h-24 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent">
             <div className='absolute -bottom-12 left-1/2 -translate-x-1/2'>
                <Avatar className="w-24 h-24 border-4 border-card bg-background ring-1 ring-border">
                    <AvatarImage
                    src={`https://picsum.photos/seed/${userProfile.id}/200/200`}
                    alt={userProfile.name}
                    data-ai-hint="person portrait"
                    />
                    <AvatarFallback>{userProfile.name?.charAt(0)}</AvatarFallback>
                </Avatar>
             </div>
          </div>
          
          <CardContent className="pt-16 pb-6 px-6">
            <h3 className="font-headline text-xl font-bold">{userProfile.name}</h3>
            <p className="text-muted-foreground mt-1 text-sm h-10">{userProfile.bio || 'Loves connecting with new people.'}</p>
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
