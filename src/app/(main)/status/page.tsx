"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

type Status = {
  id: string;
  name: string;
  avatarUrl: string;
  imageUrl: string;
  imageHint: string;
  hasNew: boolean;
};

const mockUsers = [
    { id: 'user1', name: 'Alice', avatarUrl: 'https://picsum.photos/seed/user1/200' },
    { id: 'user2', name: 'Bob', avatarUrl: 'https://picsum.photos/seed/user2/200' },
    { id: 'user3', name: 'Charlie', avatarUrl: 'https://picsum.photos/seed/user3/200' },
    { id: 'user4', name: 'Diana', avatarUrl: 'https://picsum.photos/seed/user4/200' },
    { id: 'user5', name: 'Ethan', avatarUrl: 'https://picsum.photos/seed/user5/200' },
    { id: 'user6', name: 'Fiona', avatarUrl: 'https://picsum.photos/seed/user6/200' },
    { id: 'user7', name: 'George', avatarUrl: 'https://picsum.photos/seed/user7/200' },
];

// Combine placeholder images with mock users
const mockStatuses: Status[] = mockUsers.map((user, index) => {
    const statusImage = PlaceHolderImages.find(p => p.id === `status-${user.id}`);
    return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        imageUrl: statusImage?.imageUrl || `https://picsum.photos/seed/status${index + 1}/400/600`,
        imageHint: statusImage?.imageHint || 'status update',
        hasNew: Math.random() > 0.5, // Randomly set some statuses as new
    };
});

export default function StatusPage() {
  const [statuses] = useState<Status[]>(mockStatuses);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(statuses.find(s => s.hasNew) || (statuses.length > 0 ? statuses[0] : null));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddStatusClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-[calc(100vh_-_var(--header-height)_-_theme(spacing.16))] flex flex-col" style={{ '--header-height': '60px' } as React.CSSProperties}>
       <Card className="glass flex-shrink-0">
         <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold font-headline tracking-tight">Status</h1>
                <Button size="sm" onClick={handleAddStatusClick}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Status
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
            </div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">Recent updates</h2>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-6 pb-4">
                {statuses.map((status) => (
                    <div
                        key={status.id}
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                        onClick={() => setSelectedStatus(status)}
                    >
                        <Avatar className={cn(
                            `w-16 h-16 border-2 p-1 transition-transform group-hover:scale-105`,
                            status.hasNew ? 'border-primary' : 'border-muted',
                            selectedStatus?.id === status.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        )}>
                            <AvatarImage src={status.avatarUrl} />
                            <AvatarFallback>{status.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{status.name}</span>
                    </div>
                ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
         </CardContent>
       </Card>

      <div className="flex-grow flex items-center justify-center p-4">
        {selectedStatus ? (
            <Card className="w-full max-w-sm bg-card aspect-[9/16] relative overflow-hidden shadow-2xl">
                 <Image
                  src={selectedStatus.imageUrl}
                  alt={`Status from ${selectedStatus.name}`}
                  fill
                  className="object-cover"
                  data-ai-hint={selectedStatus.imageHint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="relative z-10 flex flex-col justify-between h-full p-4 text-primary-foreground">
                     <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary-foreground/80">
                            <AvatarImage src={selectedStatus.avatarUrl} />
                            <AvatarFallback>{selectedStatus.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-bold font-headline">{selectedStatus.name}</h3>
                            <p className="text-xs text-primary-foreground/80">23 minutes ago</p>
                        </div>
                     </div>
                     <div className="text-center text-xs text-primary-foreground/80">
                        <p>Tap to view next. Updates disappear after 24 hours.</p>
                     </div>
                </div>
            </Card>
        ) : (
            <div className="text-center text-muted-foreground">
                <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-xl font-bold font-headline">No Status Available</h2>
                <p>Select a status from the list above to view it.</p>
            </div>
        )}
      </div>
    </div>
  );
}

    