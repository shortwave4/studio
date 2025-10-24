import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusCircle } from "lucide-react";

export default function StatusPage() {
  const statuses = [
    { name: "Alice", avatar: "user1", hasNew: true },
    { name: "Bob", avatar: "user2", hasNew: true },
    { name: "Charlie", avatar: "user3", hasNew: false },
    { name: "Diana", avatar: "user4", hasNew: true },
    { name: "Ethan", avatar: "user5", hasNew: false },
    { name: "Fiona", avatar: "user6", hasNew: false },
    { name: "George", avatar: "user7", hasNew: true },
  ];

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Status</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Status
        </Button>
      </div>

      <h2 className="text-lg font-semibold text-muted-foreground mb-4">Recent updates</h2>
      
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-6 pb-4">
          {statuses.map((status) => (
            <div key={status.name} className="flex flex-col items-center gap-2 cursor-pointer group">
              <Avatar className={`w-20 h-20 border-2 ${status.hasNew ? 'border-primary' : 'border-muted'} p-1 transition-transform group-hover:scale-105`}>
                <AvatarImage src={`https://picsum.photos/seed/${status.avatar}/200`} />
                <AvatarFallback>{status.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{status.name}</span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      <div className="mt-12 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gradient-animation text-primary-foreground">
          <CardContent className="p-10 text-center">
             <div className="flex justify-center mb-4">
                 <Avatar className="w-32 h-32 border-4 border-primary-foreground p-1">
                    <AvatarImage src="https://picsum.photos/seed/user1/400" />
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
             </div>
            <h3 className="text-2xl font-bold font-headline">Viewing Alice's Status</h3>
            <p className="text-primary-foreground/80 mt-2">Tap to view next. Updates disappear after 24 hours.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
