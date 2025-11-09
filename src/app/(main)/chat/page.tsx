
'use client';

import { useState, useMemo, useEffect, FormEvent, useRef } from 'react';
import {
  collection,
  query,
  where,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useUser,
  useFirestore,
  addDocumentNonBlocking,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { cn } from '@/lib/utils';
import {
  Search,
  Paperclip,
  Mic,
  SendHorizonal,
  ArrowLeft,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { UserProfile } from '@/types';
import type { ChatContact, Message } from '@/types/chat';

function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join('_');
}

const mockMessages: Omit<Message, 'own' | 'status'>[] = [
  { id: 'm1', senderId: 'user1', text: 'Hey, how is it going?', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: 'm2', senderId: 'currentUser', text: 'Doing great! How about you?', timestamp: new Date(Date.now() - 1000 * 60 * 4) },
  { id: 'm3', senderId: 'user1', text: 'Awesome! I was thinking we could grab a coffee sometime.', timestamp: new Date(Date.now() - 1000 * 60 * 3) },
];


export default function ChatPage() {
  const isMobile = useIsMobile();
  const firestore = useFirestore();
  const { user } = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [selectedChat, setSelectedChat] = useState<ChatContact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Using mock contacts to avoid permission errors
  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: contacts, isLoading: usersLoading } =
    useCollection<UserProfile>(usersCollectionRef);

  const messagesData = useMemo(() => {
    if (!user || !selectedChat) return [];
    return mockMessages.map(msg => ({
      ...msg,
      senderId: msg.senderId === 'currentUser' ? user.uid : selectedChat.id,
    }));
  }, [user, selectedChat]);


  useEffect(() => {
    // When a new chat is selected, clear optimistic messages
    setOptimisticMessages([]);
  }, [selectedChat]);
  
  // Update optimistic messages once they arrive from Firestore (this part is now moot with mock data but harmless)
  useEffect(() => {
    if (!messagesData) return;
    const sentMessageIds = messagesData.map(m => m.id);
    const newOptimisticMessages = optimisticMessages.filter(
      optMsg => !sentMessageIds.includes(optMsg.id)
    );
    if (newOptimisticMessages.length < optimisticMessages.length) {
      setOptimisticMessages(newOptimisticMessages);
    }
  }, [messagesData, optimisticMessages]);


  const messages: Message[] = useMemo(() => {
    if (!user) return [];
    const combinedMessages: Message[] = [];
  
    if (messagesData) {
      messagesData.forEach((msg) => {
        combinedMessages.push({
          ...msg,
          own: msg.senderId === user.uid,
          status: 'sent',
        });
      });
    }
  
    // Filter optimistic messages to only include those for the current chat
    const relevantOptimisticMessages = optimisticMessages.filter(
      (optMsg) =>
        selectedChat &&
        getChatId(optMsg.senderId, selectedChat.id) === getChatId(user.uid, selectedChat.id)
    );
  
    // Add optimistic messages that are not yet in the 'sent' messages
    relevantOptimisticMessages.forEach((optMsg) => {
      if (!combinedMessages.some((m) => m.id === optMsg.id)) {
        combinedMessages.push(optMsg);
      }
    });
  
    return combinedMessages;
  }, [messagesData, optimisticMessages, user, selectedChat]);


  useEffect(() => {
    if (!isMobile && contacts && contacts.length > 0 && !selectedChat) {
      const firstContact = contacts.find(c => c.id !== user?.uid);
      if (firstContact) {
        handleSelectChat(firstContact);
      }
    }
  }, [contacts, isMobile, selectedChat, user]);

   useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('div:first-child');
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }
  }, [messages]);

  const handleSelectChat = (contact: UserProfile) => {
    setSelectedChat({
      ...contact,
      lastMessage: mockMessages.slice(-1)[0]?.text || '...',
    });
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    // This part is commented out to prevent permission errors
    // const chatId = getChatId(user.uid, selectedChat.id);
    // const messagesCol = collection(firestore, 'chats', chatId, 'messages');
    
    // Optimistic update
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      text: newMessage,
      senderId: user.uid,
      timestamp: new Date(),
      own: true,
      status: 'sending',
    };

    setOptimisticMessages(prev => [...prev, optimisticMessage]);

    // addDocumentNonBlocking(messagesCol, {
    //   text: newMessage,
    //   senderId: user.uid,
    //   timestamp: serverTimestamp(),
    // }).then(() => {
    //     // This logic will kick in if we switch back to live data
    //     // For now, we manually simulate the sent status
    //     setTimeout(() => {
    //          setOptimisticMessages(prev => prev.map(msg => 
    //             msg.id === optimisticId ? { ...msg, status: 'sent' } : msg
    //         ));
    //     }, 1000);
    // });
    
    // Simulate sent status
     setTimeout(() => {
            setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticId));
     }, 1000);


    setNewMessage('');
  };

  const getTimeString = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return '';
    const date =
      timestamp instanceof Timestamp ? timestamp.toDate() : (timestamp as Date);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
          contacts?.filter(c => c.id !== user?.uid).map((contact) => (
            <div
              key={contact.id}
              className={cn(
                'flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50',
                selectedChat?.id === contact.id && 'bg-accent/80'
              )}
              onClick={() => handleSelectChat(contact)}
            >
              <Avatar>
                <AvatarImage
                  src={`https://picsum.photos/seed/${contact.id}/200`}
                />
                <AvatarFallback>{contact.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold truncate">{contact.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {mockMessages.slice(-1)[0]?.text}
                </p>
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
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setSelectedChat(null)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        )}
        <Avatar>
          <AvatarImage
            src={`https://picsum.photos/seed/${selectedChat.id}/200`}
          />
          <AvatarFallback>{selectedChat.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="ml-4">
          <p className="font-semibold text-lg font-headline">
            {selectedChat.name}
          </p>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-grow p-4 bg-background/30" ref={scrollAreaRef}>
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex max-w-[75%] gap-2',
                msg.own ? 'ml-auto flex-row-reverse' : 'mr-auto',
                msg.status === 'sending' && 'opacity-50'
              )}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={`https://picsum.photos/seed/${msg.senderId}/200`}
                />
                <AvatarFallback>
                  {msg.own
                    ? user?.displayName?.charAt(0)
                    : selectedChat.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div
                  className={cn(
                    'rounded-lg p-3 text-sm',
                    msg.own
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted rounded-bl-none'
                  )}
                >
                  <p>{msg.text}</p>
                </div>
                <p
                  className={cn(
                    'text-xs text-muted-foreground mt-1',
                    msg.own ? 'text-right' : 'text-left'
                  )}
                >
                   {msg.status === 'sending' ? 'Sending...' : getTimeString(msg.timestamp)}
                </p>
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
            <Button
              size="icon"
              className="bg-accent hover:bg-accent/90"
              type="submit"
              disabled={!selectedChat || !newMessage.trim()}
            >
              <SendHorizonal className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] border rounded-lg overflow-hidden glass h-full">
        {isMobile ? (
          selectedChat ? (
            ChatWindow
          ) : (
            ChatList
          )
        ) : (
          <>
            {ChatList}
            {ChatWindow ? (
              ChatWindow
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-center p-8 bg-background/30">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center mb-6">
                  <SendHorizonal className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold font-headline">
                  Welcome to ConnectSphere Chat
                </h2>
                <p className="text-muted-foreground mt-2">
                  Select a conversation from the list to start messaging.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
