
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Search, Paperclip, Mic, SendHorizonal } from "lucide-react";

type Contact = {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
};

type Message = {
  id: number;
  sender: string;
  text: string;
  time: string;
  own: boolean;
};

const contacts: Contact[] = [
  { id: 1, name: "Alice", lastMessage: "See you tomorrow!", time: "10:42", unread: 2, avatar: "user1" },
  { id: 2, name: "Group Project", lastMessage: "Bob: I'll push the changes.", time: "09:15", unread: 0, avatar: "user2" },
  { id: 3, name: "Charlie", lastMessage: "Sounds good!", time: "Yesterday", unread: 0, avatar: "user3" },
  { id: 4, name: "Diana", lastMessage: "Photo", time: "Yesterday", unread: 0, avatar: "user4" },
];

const messages: Record<string, Message[]> = {
  "1": [
    { id: 1, sender: "Alice", text: "Hey! How's it going?", time: "10:30", own: false },
    { id: 2, sender: "You", text: "Pretty good, just working on the ConnectSphere app. You?", time: "10:31", own: true },
    { id: 3, sender: "Alice", text: "Nice! I'm just chilling. Btw, did you see that new affiliate product?", time: "10:32", own: false },
    { id: 4, sender: "Alice", text: "It looks amazing!", time: "10:32", own: false },
    { id: 5, sender: "You", text: "Yeah, the admin just added it. The link button is a nice touch.", time: "10:35", own: true },
    { id: 6, sender: "Alice", text: "Totally. Let's catch up later!", time: "10:40", own: false },
    { id: 7, sender: "You", text: "See you tomorrow!", time: "10:42", own: true },
  ],
  "2": [
      { id: 1, sender: "Bob", text: "Alright team, let's sync up on the project.", time: "09:00", own: false },
      { id: 2, sender: "You", text: "Sounds good. I'm almost done with my part.", time: "09:01", own: true },
      { id: 3, sender: "Alice", text: "I've finished the designs, will upload them now.", time: "09:05", own: false },
      { id: 4, sender: "Bob", text: "Great! I'll push the latest backend changes.", time: "09:15", own: false },
  ],
  "3": [
      { id: 1, sender: "Charlie", text: "Hey, are we still on for lunch?", time: "Yesterday", own: false },
      { id: 2, sender: "You", text: "Yep! 1pm at the usual spot.", time: "Yesterday", own: true },
      { id: 3, sender: "Charlie", text: "Sounds good!", time: "Yesterday", own: false },
  ],
  "4": [
      { id: 1, sender: "Diana", text: "Check out this photo from my trip!", time: "Yesterday", own: false },
      { id: 2, sender: "You", text: "Wow, that looks incredible!", time: "Yesterday", own: true },
  ]
};

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<Contact>(contacts[0]);

  const currentMessages = messages[selectedChat.id] || [];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-grow grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] border rounded-lg overflow-hidden glass">
        {/* Contacts List */}
        <div className="flex flex-col border-r bg-muted/20">
          <div className="p-4">
            <h1 className="text-2xl font-bold font-headline">Chats</h1>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search chats..." className="pl-10" />
            </div>
          </div>
          <Separator />
          <ScrollArea className="flex-grow">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={cn(
                  "flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50",
                  selectedChat.id === contact.id && "bg-accent/80"
                )}
                onClick={() => setSelectedChat(contact)}
              >
                <Avatar>
                  <AvatarImage src={`https://picsum.photos/seed/${contact.avatar}/200`} />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow overflow-hidden">
                  <p className="font-semibold truncate">{contact.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                </div>
                <div className="text-xs text-muted-foreground text-right space-y-1">
                  <p>{contact.time}</p>
                  {contact.unread > 0 && (
                    <span className="inline-block bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className="flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center p-3 border-b">
            <Avatar>
              <AvatarImage src={`https://picsum.photos/seed/${selectedChat.avatar}/200`} />
              <AvatarFallback>{selectedChat.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <p className="font-semibold text-lg font-headline">{selectedChat.name}</p>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-grow p-4 bg-background/30">
            <div className="flex flex-col gap-4">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex max-w-[75%] gap-2",
                    msg.own ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <Avatar className="w-8 h-8">
                     <AvatarImage src={`https://picsum.photos/seed/${msg.own ? 'user-avatar' : selectedChat.avatar}/200`} />
                     <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div
                      className={cn(
                        "rounded-lg p-3 text-sm",
                        msg.own
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      )}
                    >
                      <p>{msg.text}</p>
                    </div>
                     <p className={cn("text-xs text-muted-foreground mt-1", msg.own ? 'text-right' : 'text-left')}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="relative">
              <Input placeholder="Type a message..." className="pr-28" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-5 h-5" />
                </Button>
                 <Button variant="ghost" size="icon">
                  <Mic className="w-5 h-5" />
                </Button>
                <Button size="icon" className="bg-accent hover:bg-accent/90">
                  <SendHorizonal className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

    