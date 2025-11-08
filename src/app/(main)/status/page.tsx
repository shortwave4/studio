"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = {
  name: string;
  avatar: string;
  imageUrl: string;
  hasNew: boolean;
};

export default function StatusPage() {
  const statuses: Status[] = [
    { name: "Alice", avatar: "user1", imageUrl: "https://picsum.photos/seed/status1/400/600", hasNew: true },
    { name: "Bob", avatar: "user2", imageUrl: "https://picsum.photos/seed/status2/400/600", hasNew: true },
    { name: "Charlie", avatar: "user3", imageUrl: "https://picsum.photos/seed/status3/400/600", hasNew: false },
    { name: "Diana", avatar: "user4", imageUrl: "https://picsum.photos/seed/status4/400/600", hasNew: true },
    { name: "Ethan", avatar: "user5", imageUrl: "https://picsum.photos/seed/status5/400/600", hasNew: false },
    { name: "Fiona", avatar: "user6", imageUrl: "https://picsum.photos/seed/status6/400/600", hasNew: false },
    { name: "George", avatar: "user7", imageUrl: "https://picsum.photos/seed/status7/400/600", hasNew: true },
  ];
  
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(statuses.find(s => s.hasNew) || null);

  return (
    <div className="h-[calc(100vh_-_theme(space.16)_-_theme(space.16))] flex flex-col gap-6">
       <Card className="glass flex-shrink-0">
         <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold font-headline tracking-tight">Status</h1>
                <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Status
                </Button>
            </div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-4">Recent updates</h2>
            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex w-max space-x-6 pb-4">
                {statuses.map((status) => (
                    <div 
                        key={status.name} 
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                        onClick={() => setSelectedStatus(status)}
                    >
                        <Avatar className={cn(
                            `w-16 h-16 border-2 p-1 transition-transform group-hover:scale-105`,
                            status.hasNew ? 'border-primary' : 'border-muted',
                            selectedStatus?.name === status.name && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        )}>
                            <AvatarImage src={`https://picsum.photos/seed/${status.avatar}/200`} />
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
      
      <div className="flex-grow flex items-center justify-center">
        {selectedStatus ? (
            <Card className="w-full max-w-md bg-gradient-animation text-primary-foreground aspect-[9/16] relative overflow-hidden">
                <Image 
                  src={selectedStatus.imageUrl} 
                  alt={`Status from ${selectedStatus.name}`}
                  fill
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="relative z-10 flex flex-col justify-between h-full p-6 bg-black/20">
                     <div>
                        <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 border-2 border-primary-foreground/80 p-0.5">
                                <AvatarImage src={`https://picsum.photos/seed/${selectedStatus.avatar}/200`} />
                                <AvatarFallback>{selectedStatus.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-bold font-headline text-lg">{selectedStatus.name}</h3>
                                <p className="text-xs text-primary-foreground/80">23 minutes ago</p>
                            </div>
                        </div>
                     </div>
                     <div className="text-center">
                        <p className="text-primary-foreground/80 mt-2 text-sm">Tap to view next. Updates disappear after 24 hours.</p>
                     </div>
                </div>
            </Card>
        ) : (
            <div className="text-center text-muted-foreground">
                <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-xl font-bold font-headline">No Status Selected</h2>
                <p>Select a status from the list above to view it.</p>
            </div>
        )}
      </div>
    </div>
  );
}
