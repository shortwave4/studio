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

// Create statuses from placeholder data
const statusUsers = PlaceHolderImages.filter(p => p.id.startsWith('user-'));
const mockStatuses: Status[] = statusUsers.map((user) => {
    // The status image ID should correspond to the user ID.
    const statusImage = PlaceHolderImages.find(p => p.id === `status-${user.id}`);
    return {
        id: user.id,
        name: user.description, // Use description for name for more variety
        avatarUrl: user.imageUrl,
        imageUrl: statusImage?.imageUrl || `https://picsum.photos/seed/status-${user.id}/400/600`,
        imageHint: statusImage?.imageHint || 'status update',
        hasNew: Math.random() > 0.5,
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
    <div className="h-[calc(100vh_-_var(--header-height)_-_theme(spacing.8))] md:h-[calc(100vh_-_var(--header-height)_-_theme(spacing.12))] flex flex-col gap-4 md:gap-6" style={{ '--header-height': '60px' } as React.CSSProperties}>
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

      <div className="flex-grow flex items-center justify-center p-0 md:p-4">
        {selectedStatus ? (
            <Card className="w-full max-w-sm bg-card aspect-[9/16] relative overflow-hidden shadow-2xl h-full md:h-auto md:max-h-full rounded-none md:rounded-lg">
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
