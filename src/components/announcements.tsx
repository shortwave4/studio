
'use client';

import * as React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Announcement = {
    id: string;
    title: string;
    message: string;
    timestamp: Timestamp;
};

export default function Announcements() {
    const firestore = useFirestore();
    const announcementsCollection = useMemoFirebase(() => collection(firestore, 'announcements'), [firestore]);
    const announcementsQuery = useMemoFirebase(() => {
        if (!announcementsCollection) return null;
        return query(announcementsCollection, orderBy('timestamp', 'desc'), limit(5));
    }, [announcementsCollection]);

    const { data: announcements, isLoading } = useCollection<Announcement>(announcementsQuery);

    if (isLoading || !announcements || announcements.length === 0) {
        return null; // Don't render anything if loading or no announcements
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold font-headline tracking-tight mb-4 flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-primary" />
                Announcements
            </h2>
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent>
                    {announcements.map((announcement) => (
                        <CarouselItem key={announcement.id}>
                            <Card className="bg-card/80 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>{announcement.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{announcement.message}</p>
                                    <p className="text-xs text-muted-foreground/80 mt-4">
                                        {formatDistanceToNow(announcement.timestamp.toDate(), { addSuffix: true })}
                                    </p>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        </div>
    );
}
