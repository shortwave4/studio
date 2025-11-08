
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

type StatusStory = {
  id: string;
  imageUrl: string;
  imageHint: string;
  duration: number; 
};

type StatusUser = {
  id: string;
  name: string;
  avatarUrl: string;
  stories: StatusStory[];
  hasNew: boolean;
};

// Create statuses from placeholder data
const statusUsers = PlaceHolderImages.filter(p => p.id.startsWith('user-'));
const mockStatuses: StatusUser[] = statusUsers.map((user) => {
    const statusImage = PlaceHolderImages.find(p => p.id === `status-${user.id}`);
    return {
        id: user.id,
        name: user.description,
        avatarUrl: user.imageUrl,
        stories: [
            {
                id: statusImage?.id || `story-${user.id}`,
                imageUrl: statusImage?.imageUrl || `https://picsum.photos/seed/status-${user.id}/400/700`,
                imageHint: statusImage?.imageHint || 'status update',
                duration: 5000, // 5 seconds
            }
        ],
        hasNew: Math.random() > 0.5,
    };
});

export default function StatusPage() {
  const [statuses] = useState<StatusUser[]>(mockStatuses);
  const [activeUser, setActiveUser] = useState<StatusUser | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressTimerRef = useRef<NodeJS.Timeout>();

  const startTimer = useCallback(() => {
    if (!activeUser) return;
    
    const story = activeUser.stories[activeStoryIndex];
    if (!story) return;

    setProgress(0);
    clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
        setProgress(p => p + 10 / story.duration * 100);
    }, 10);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNextStory();
    }, story.duration);

  }, [activeUser, activeStoryIndex]);

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
  
  const handleNextUser = () => {
      if(!activeUser) return;
      const currentUserIndex = statuses.findIndex(u => u.id === activeUser.id);
      const nextUserIndex = (currentUserIndex + 1) % statuses.length;
      handleSelectUser(statuses[nextUserIndex]);
  }

  const handlePrevUser = () => {
      if(!activeUser) return;
      const currentUserIndex = statuses.findIndex(u => u.id === activeUser.id);
      const prevUserIndex = (currentUserIndex - 1 + statuses.length) % statuses.length;
      handleSelectUser(statuses[prevUserIndex]);
  }

  const handleNextStory = () => {
    if (!activeUser) return;
    if (activeStoryIndex < activeUser.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {
      handleNextUser();
    }
  };

  const handlePrevStory = () => {
    if (!activeUser) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else {
      handlePrevUser();
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

  if (activeUser) {
      const activeStory = activeUser.stories[activeStoryIndex];
    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={closeStatus}>
            <div className="relative w-full max-w-sm h-full max-h-[95vh] md:max-h-[80vh] aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <Image
                    src={activeStory.imageUrl}
                    alt={`Status from ${activeUser.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint={activeStory.imageHint}
                />
                 <div className="absolute inset-x-0 top-0 p-3 z-20">
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
                            <p className="text-xs text-white/80">23m ago</p>
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
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Status
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {statuses.map((status) => (
          <div
            key={status.id}
            className="relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => handleSelectUser(status)}
          >
            <Image
              src={status.stories[0].imageUrl}
              alt={status.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              data-ai-hint={status.stories[0].imageHint}
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
    </div>
  );
}

