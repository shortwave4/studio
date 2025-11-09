
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";

type StatusStory = {
  id: string;
  mediaUrl: string;
  text?: string;
  timestamp: Timestamp;
  duration: number;
};

type StatusUser = {
  id: string;
  name: string;
  avatarUrl: string;
  stories: StatusStory[];
  hasNew: boolean;
};

export default function StatusPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeUser, setActiveUser] = useState<StatusUser | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressTimerRef = useRef<NodeJS.Timeout>();
  
  // 1. Fetch all users
  const { data: users, isLoading: usersLoading } = useCollection(
    collection(firestore, 'users')
  );

  // 2. For each user, fetch their status updates from the last 24 hours
  const [statuses, setStatuses] = useState<StatusUser[]>([]);
  const [statusesLoading, setStatusesLoading] = useState(true);

  useEffect(() => {
    if (!users || users.length === 0) {
      if (!usersLoading) setStatusesLoading(false);
      return;
    };

    const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

    const fetchStatusesForUsers = async () => {
      setStatusesLoading(true);
      const userStatusPromises = users.map(async (u) => {
        const statusUpdatesRef = collection(firestore, 'users', u.id, 'status_updates');
        const q = query(statusUpdatesRef, where('timestamp', '>=', twentyFourHoursAgo));
        const statusSnap = await getDocs(q);
        
        if (statusSnap.empty) {
          return null;
        }

        const stories: StatusStory[] = statusSnap.docs.map(doc => ({
          id: doc.id,
          mediaUrl: doc.data().mediaUrl,
          text: doc.data().text,
          timestamp: doc.data().timestamp,
          duration: 5000, // 5 seconds per story
        })).sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

        return {
          id: u.id,
          name: u.name,
          avatarUrl: u.profilePictureUrl || `https://picsum.photos/seed/${u.id}/200`,
          stories,
          hasNew: true, // You could add logic to determine if they are "new"
        };
      });

      const results = (await Promise.all(userStatusPromises)).filter(Boolean) as StatusUser[];
      setStatuses(results);
      setStatusesLoading(false);
    };

    fetchStatusesForUsers();

  }, [users, firestore, usersLoading]);

  const handleNextStory = useCallback(() => {
    if (!activeUser) return;
    if (activeStoryIndex < activeUser.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {
      const currentUserIndex = statuses.findIndex(u => u.id === activeUser.id);
      const nextUserIndex = (currentUserIndex + 1) % statuses.length;
      if (statuses[nextUserIndex]) {
        handleSelectUser(statuses[nextUserIndex]);
      } else {
        closeStatus();
      }
    }
  }, [activeUser, activeStoryIndex, statuses]);

  const startTimer = useCallback(() => {
    if (!activeUser) return;
    
    const story = activeUser.stories[activeStoryIndex];
    if (!story) return;

    setProgress(0);
    clearInterval(progressTimerRef.current);
    const interval = setInterval(() => {
        setProgress(p => {
            if (p >= 100) {
                clearInterval(interval);
                return 100;
            }
            return p + 100 / (story.duration / 100);
        });
    }, 100);
    progressTimerRef.current = interval;


    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNextStory();
    }, story.duration);

  }, [activeUser, activeStoryIndex, handleNextStory]);

  useEffect(() => {
    if (activeUser) {
      startTimer();
    } else {
      clearTimeout(timerRef.current);
      clearInterval(progressTimerRef.current);
    }
    
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, [activeUser, activeStoryIndex, startTimer]);
  
  const handlePrevStory = () => {
    if (!activeUser) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else {
      const currentUserIndex = statuses.findIndex(u => u.id === activeUser.id);
      const prevUserIndex = (currentUserIndex - 1 + statuses.length) % statuses.length;
      if (statuses[prevUserIndex]) {
        handleSelectUser(statuses[prevUserIndex]);
      }
    }
  };


  const handleSelectUser = (user: StatusUser) => {
    setActiveUser(user);
    setActiveStoryIndex(0);
    setProgress(0);
  };
  
  const closeStatus = () => {
      setActiveUser(null);
  }

  const handleAddStatus = () => {
    // In a real app, this would open a modal to upload a new status.
    // For now, it will just log to the console.
    console.log("Add new status clicked");
  }

  if (activeUser) {
      const activeStory = activeUser.stories[activeStoryIndex];
    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={closeStatus}>
            <div className="relative w-full max-w-sm h-full max-h-[95vh] md:max-h-[80vh] aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <Image
                    src={activeStory.mediaUrl}
                    alt={`Status from ${activeUser.name}`}
                    fill
                    className="object-cover"
                />
                 <div className="absolute inset-x-0 top-0 p-3 z-20 bg-gradient-to-b from-black/50 to-transparent">
                    <div className="flex items-center gap-2 mb-2">
                        {activeUser.stories.map((_, index) => (
                           <Progress key={index} value={index < activeStoryIndex ? 100 : (index === activeStoryIndex ? progress : 0)} className="h-1 w-full bg-white/30" />
                        ))}
                    </div>
                     <div className="flex items-center gap-3 text-white">
                        <Avatar className="w-10 h-10 border-2 border-white/80">
                            <AvatarImage src={activeUser.avatarUrl} />
                            <AvatarFallback>{activeUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-bold font-headline">{activeUser.name}</h3>
                            <p className="text-xs text-white/80">
                              {activeStory.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                     </div>
                 </div>
                 <div className="absolute top-3 right-3 z-20">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={closeStatus}>
                        <X className="w-6 h-6"/>
                    </Button>
                </div>

                {/* Navigation overlays */}
                 <div className="absolute left-0 top-0 h-full w-1/3 z-10" onClick={handlePrevStory} />
                 <div className="absolute right-0 top-0 h-full w-1/3 z-10" onClick={handleNextStory} />
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-headline">Status</h1>
        <Button size="sm" onClick={handleAddStatus}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Status
        </Button>
      </div>
      {(statusesLoading || usersLoading) ? (
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="relative aspect-[9/16] rounded-lg overflow-hidden bg-muted animate-pulse">
                <div className="absolute bottom-0 left-0 p-3 w-full">
                    <div className="w-10 h-10 mb-2 rounded-full bg-muted-foreground/20" />
                    <div className="h-4 w-3/4 rounded bg-muted-foreground/20" />
                </div>
              </div>
            ))}
        </div>
      ) : statuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-card/50 rounded-lg">
          <X className="w-16 h-16 text-muted-foreground mb-4"/>
          <h2 className="text-xl font-bold">No Status Updates</h2>
          <p className="text-muted-foreground">Check back later to see what your friends are up to!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {statuses.map((status) => (
            <div
              key={status.id}
              className="relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => handleSelectUser(status)}
            >
              <Image
                src={status.stories[0].mediaUrl}
                alt={status.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 p-3 text-white">
                <Avatar className={cn("w-10 h-10 mb-2 border-2", status.hasNew ? 'border-primary' : 'border-muted')}>
                  <AvatarImage src={status.avatarUrl} />
                  <AvatarFallback>{status.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{status.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

