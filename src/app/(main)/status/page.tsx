
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, X, ImagePlus, Send, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, where, Timestamp, serverTimestamp, orderBy, getDocs, writeBatch, doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/types";
import { Card } from "@/components/ui/card";
import { uploadToCloudinary } from "@/lib/cloudinary";

type StatusStory = {
  id: string;
  userId: string;
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
};

let cleanupHasRun = false;

export default function StatusPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeUser, setActiveUser] = useState<StatusUser | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressTimerRef = useRef<NodeJS.Timeout>();
  const [isStoryLoading, setIsStoryLoading] = useState(true);
  
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [statusFile, setStatusFile] = useState<File | null>(null);
  const [statusPreview, setStatusPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersCollectionRef);

  const [statuses, setStatuses] = useState<StatusUser[]>([]);
  const [statusesLoading, setStatusesLoading] = useState(true);
  
  const twentyFourHoursAgo = useMemo(() => Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000), []);
  const statusUpdatesQuery = useMemoFirebase(() => query(
      collection(firestore, 'status_updates'), 
      where('timestamp', '>=', twentyFourHoursAgo),
      orderBy('timestamp', 'desc')
    ), [firestore, twentyFourHoursAgo]);

  const { data: allStatuses, isLoading: rawStatusesLoading } = useCollection<Omit<StatusStory, 'duration'>>(statusUpdatesQuery);

    useEffect(() => {
    const cleanupExpiredStatuses = async () => {
      if (cleanupHasRun || !user) return;
      cleanupHasRun = true; 

      try {
        const expiredStatusesQuery = query(
          collection(firestore, 'status_updates'),
          where('timestamp', '<', twentyFourHoursAgo)
        );
        
        const expiredSnap = await getDocs(expiredStatusesQuery);
        if (expiredSnap.empty) return;

        const batch = writeBatch(firestore);
        expiredSnap.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();

      } catch (error) {
        console.error("Failed to clean up expired statuses:", error);
      }
    };

    cleanupExpiredStatuses();
  }, [firestore, twentyFourHoursAgo, user]);


  useEffect(() => {
    if (rawStatusesLoading || usersLoading) {
      setStatusesLoading(true);
      return;
    }

    if (!allStatuses || !usersData) {
      setStatuses([]);
      setStatusesLoading(false);
      return;
    }

    const usersMap = new Map(usersData.map(u => [u.id, u]));
    const statusesByUser = new Map<string, StatusUser>();

    allStatuses.forEach(status => {
      const storyAuthor = usersMap.get(status.userId);
      if (!storyAuthor) return;

      const story: StatusStory = { ...status, duration: 5000 };

      if (statusesByUser.has(status.userId)) {
        statusesByUser.get(status.userId)!.stories.push(story);
      } else {
        statusesByUser.set(status.userId, {
          id: storyAuthor.id,
          name: storyAuthor.name,
          avatarUrl: storyAuthor.profilePictureUrl || `https://picsum.photos/seed/${storyAuthor.id}/200`,
          stories: [story],
        });
      }
    });

    // Sort stories within each user group from oldest to newest
    statusesByUser.forEach(user => {
      user.stories.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    });

    setStatuses(Array.from(statusesByUser.values()));
    setStatusesLoading(false);

  }, [allStatuses, usersData, rawStatusesLoading, usersLoading]);

  const handleSelectUser = useCallback((user: StatusUser) => {
    setActiveUser(user);
    setActiveStoryIndex(0);
    setProgress(0);
    setIsStoryLoading(true);
  }, []);

  const closeStatus = useCallback(() => {
      setActiveUser(null);
  }, []);

  const handleNextStory = useCallback(() => {
    if (!activeUser) return;
    setIsStoryLoading(true);
    if (activeStoryIndex < activeUser.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {
      const currentUserIndex = statuses.findIndex(u => u.id === activeUser.id);
      if (currentUserIndex < statuses.length - 1) {
        const nextUser = statuses[currentUserIndex + 1];
        if (nextUser) {
          handleSelectUser(nextUser);
        } else {
          closeStatus();
        }
      } else {
        closeStatus();
      }
    }
  }, [activeUser, activeStoryIndex, statuses, handleSelectUser, closeStatus]);

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
    if (activeUser && !isStoryLoading) {
      startTimer();
    } else {
      clearTimeout(timerRef.current);
      clearInterval(progressTimerRef.current);
    }
    
    return () => {
      clearTimeout(timerRef.current);
      clearInterval(progressTimerRef.current);
    };
  }, [activeUser, activeStoryIndex, startTimer, isStoryLoading]);
  
  const handlePrevStory = () => {
    if (!activeUser) return;
    setIsStoryLoading(true);
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else {
       const currentUserIndex = statuses.findIndex(u => u.id === activeUser.id);
       if (currentUserIndex > 0) {
         const prevUser = statuses[currentUserIndex - 1];
         if (prevUser) {
           handleSelectUser(prevUser);
         } else {
           closeStatus();
         }
       } else {
         setActiveStoryIndex(0);
         setProgress(0);
         startTimer();
       }
    }
  };
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setStatusFile(selectedFile);
            setStatusPreview(URL.createObjectURL(selectedFile));
            setIsAddingStatus(true);
        }
    };

    const handleUpload = async () => {
        if (!statusFile || !user) return;

        setIsUploading(true);
        try {
            const downloadURL = await uploadToCloudinary(statusFile);
            
            const statusCollectionRef = collection(firestore, 'status_updates');
            await addDocumentNonBlocking(statusCollectionRef, {
                mediaUrl: downloadURL,
                timestamp: serverTimestamp(),
                userId: user.uid,
                type: 'image', 
            });
            
            toast({ title: "Status Added!", description: "Your new status is now live." });
            handleCancelAddStatus();
        } catch (error) {
            console.error("Status upload failed:", error);
            toast({ variant: "destructive", title: "Upload Failed", description: "Could not add your status." });
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancelAddStatus = () => {
        setIsAddingStatus(false);
        setStatusFile(null);
        setStatusPreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

  if (activeUser) {
      const activeStory = activeUser.stories[activeStoryIndex];
    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onMouseDown={closeStatus} onTouchStart={closeStatus}>
            <div className="relative w-full max-w-sm h-full max-h-[95vh] md:max-h-[80vh] aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-2xl" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                {isStoryLoading && <Skeleton className="absolute inset-0 w-full h-full animate-pulse" />}
                {activeStory && <Image
                    src={activeStory.mediaUrl}
                    alt={`Status from ${activeUser.name}`}
                    fill
                    className={cn("object-cover", isStoryLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300")}
                    onLoad={() => setIsStoryLoading(false)}
                    unoptimized
                />}
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
                              {activeStory?.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                     </div>
                 </div>
                 <div className="absolute top-3 right-3 z-20">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={closeStatus}>
                        <X className="w-6 h-6"/>
                    </Button>
                </div>

                 <div className="absolute left-0 top-0 h-full w-1/3 z-10" onMouseDown={handlePrevStory} onTouchEnd={handlePrevStory}/>
                 <div className="absolute right-0 top-0 h-full w-1/3 z-10" onMouseDown={handleNextStory} onTouchEnd={handleNextStory}/>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
       <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-headline">Status</h1>
        {!isAddingStatus && (
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Status
            </Button>
        )}
      </div>

    {isAddingStatus && statusPreview && (
        <Card className="mb-6">
            <div className="p-4 space-y-4">
                <div className="relative aspect-[16/9] w-full rounded-md overflow-hidden">
                    <Image src={statusPreview} alt="Status preview" fill className="object-cover"/>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancelAddStatus} disabled={isUploading}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={!statusFile || isUploading}>
                         <Send className="mr-2 h-4 w-4" />
                        {isUploading ? "Uploading..." : "Post Status"}
                    </Button>
                </div>
            </div>
        </Card>
    )}


      {(statusesLoading) ? (
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="relative aspect-[9/16] rounded-lg overflow-hidden">
                <Skeleton className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                 <div className="absolute bottom-0 left-0 p-3 w-full">
                    <Skeleton className="w-10 h-10 mb-2 rounded-full" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              </div>
            ))}
        </div>
      ) : statuses.length === 0 && !isAddingStatus ? (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-card/50 rounded-lg">
          <ImagePlus className="w-16 h-16 text-muted-foreground mb-4"/>
          <h2 className="text-xl font-bold">No Status Updates</h2>
          <p className="text-muted-foreground">Be the first one to post a status!</p>
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
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 p-3 text-white">
                <Avatar className={cn("w-10 h-10 mb-2 border-2", 'border-primary')}>
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
