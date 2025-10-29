
"use client";

import { useState, useMemo, useEffect, FormEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Search, Paperclip, Mic, SendHorizonal, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, where, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import type { UserProfile } from '@/types';

type ChatContact = UserProfile & {
  lastMessage?: string;
  lastMessageTime?: string;
  unread?: number;
};

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | Date;
  own: boolean;
};

function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join('_');
}

export default function ChatPage() {
  const isMobile = useIsMobile();
  const firestore = useFirestore();
  const { user } = useUser();

  const usersRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersRef);

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatContact | null>(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (users && user) {
      const otherUsers = users.filter(u => u.id !== user.uid);
      setContacts(otherUsers.map(u => ({
        ...u,
        lastMessage: "...",
        lastMessageTime: "",
        unread: 0
      })));
    }
  }, [users, user]);
  
  useEffect(() => {
    if (!isMobile && contacts.length > 0) {
      setSelectedChat(contacts[0]);
    }
  }, [contacts, isMobile]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !selectedChat) return null;
    const chatId = getChatId(user.uid, selectedChat.id);
    return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  }, [firestore, user, selectedChat]);
  
  const { data: messagesData } = useCollection<Omit<Message, 'own'>>(messagesQuery);

  const messages: Message[] = useMemo(() => {
    if (!messagesData || !user) return [];
    return messagesData.map(msg => ({
      ...msg,
      own: msg.senderId === user.uid,
    }));
  }, [messagesData, user]);


  const handleSelectChat = (contact: ChatContact) => {
    setSelectedChat(contact);
  };
  
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user || !firestore) return;

    const chatId = getChatId(user.uid, selectedChat.id);
    const messagesCol = collection(firestore, 'chats', chatId, 'messages');
    
    addDocumentNonBlocking(messagesCol, {
      text: newMessage,
      senderId: user.uid,
      timestamp: serverTimestamp()
    });

    setNewMessage("");
  };

  const getTimeString = (timestamp: Timestamp | Date) => {
      if (!timestamp) return '';
      const date = (timestamp as Timestamp).toDate ? (timestamp as Timestamp).toDate() : (timestamp as Date);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const ChatList = (
    <div className="flex flex-col border-r bg-muted/20 h-full">
      <div className="p-4">
        <h1 className="text-2xl font-bold font-headline">Chats</h1>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search chats..." className="pl-10" />
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-grow">
        {usersLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-full bg-muted-foreground/20 animate-pulse" />
                 <div className="flex-grow space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted-foreground/20 animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted-foreground/20 animate-pulse" />
                 </div>
              </div>
            ))}
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className={cn(
                "flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50",
                selectedChat?.id === contact.id && "bg-accent/80"
              )}
              onClick={() => handleSelectChat(contact)}
            >
              <Avatar>
                <AvatarImage src={`https://picsum.photos/seed/${contact.id}/200`} />
                <AvatarFallback>{contact.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold truncate">{contact.name}</p>
                <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
              </div>
              <div className="text-xs text-muted-foreground text-right space-y-1">
                <p>{contact.lastMessageTime}</p>
                {contact.unread && contact.unread > 0 && (
                  <span className="inline-block bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                    {contact.unread}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );

  const ChatWindow = selectedChat && (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center p-3 border-b">
        {isMobile && (
           <Button variant="ghost" size="icon" className="mr-2" onClick={() => setSelectedChat(null)}>
             <ArrowLeft className="h-6 w-6"/>
           </Button>
        )}
        <Avatar>
          <AvatarImage src={`https://picsum.photos/seed/${selectedChat.id}/200`} />
          <AvatarFallback>{selectedChat.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <p className="font-semibold text-lg font-headline">{selectedChat.name}</p>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-grow p-4 bg-background/30">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex max-w-[75%] gap-2",
                msg.own ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <Avatar className="w-8 h-8">
                 <AvatarImage src={`https://picsum.photos/seed/${msg.own ? user?.uid : selectedChat.id}/200`} />
                 <AvatarFallback>{msg.own ? user?.displayName?.charAt(0) : selectedChat.name?.charAt(0)}</AvatarFallback>
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
                 <p className={cn("text-xs text-muted-foreground mt-1", msg.own ? 'text-right' : 'text-left')}>{getTimeString(msg.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="relative">
          <Input 
            placeholder="Type a message..." 
            className="pr-28"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!selectedChat}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button variant="ghost" size="icon" type="button">
              <Paperclip className="w-5 h-5" />
            </Button>
             <Button variant="ghost" size="icon" type="button">
              <Mic className="w-5 h-5" />
            </Button>
            <Button size="icon" className="bg-accent hover:bg-accent/90" type="submit" disabled={!selectedChat || !newMessage.trim()}>
              <SendHorizonal className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh_-_theme(space.16)_-_theme(space.16))] flex flex-col">
      <div className="flex-grow grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] border rounded-lg overflow-hidden glass">
         {isMobile ? (
          selectedChat ? ChatWindow : ChatList
        ) : (
          <>
            {ChatList}
            {ChatWindow ? ChatWindow : (
                <div className="flex flex-col h-full items-center justify-center text-center p-8 bg-background/30">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center mb-6">
                        <SendHorizonal className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold font-headline">Welcome to ConnectSphere Chat</h2>
                    <p className="text-muted-foreground mt-2">Select a conversation from the list to start messaging.</p>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


    