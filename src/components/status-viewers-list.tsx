
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/types';
import { Eye } from 'lucide-react';

interface StatusViewersListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewerIds: string[];
  allUsers: UserProfile[];
}

export function StatusViewersList({
  open,
  onOpenChange,
  viewerIds,
  allUsers,
}: StatusViewersListProps) {
  const viewers = React.useMemo(() => {
    const usersMap = new Map(allUsers.map(u => [u.id, u]));
    return viewerIds.map(id => usersMap.get(id)).filter((u): u is UserProfile => !!u);
  }, [viewerIds, allUsers]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh]">
        <SheetHeader>
          <SheetTitle>Viewed By</SheetTitle>
          <SheetDescription>
            {viewers.length} {viewers.length === 1 ? 'person has' : 'people have'} seen your status.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(60vh-100px)] mt-4">
          <div className="space-y-4 pr-6">
            {viewers.length > 0 ? (
              viewers.map(viewer => (
                <div key={viewer.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={viewer.profilePictureUrl || `https://picsum.photos/seed/${viewer.id}/200`} />
                    <AvatarFallback>{viewer.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{viewer.name}</p>
                </div>
              ))
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-10">
                    <Eye className="w-12 h-12 text-muted-foreground mb-4"/>
                    <h3 className="text-lg font-semibold">No views yet</h3>
                    <p className="text-muted-foreground text-sm">Check back later to see who has seen your status.</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

    