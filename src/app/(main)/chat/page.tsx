
'use client';

import { useState, useMemo, useEffect, FormEvent, useRef } from 'react';
import {
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
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
  useStorage
} from '@/firebase';
import { cn } from '@/lib/utils';
import {
  Search,
  Paperclip,
  Mic,
  SendHorizonal,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';
import type { UserProfile } from '@/types';
import type { ChatContact, Message } from '@/types/chat';
import { suggestUsersByLocation } from '@/ai/flows/suggest-users-by-location';
import { useToast } from '@/hooks/use-toast';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { collection } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';

function getChatId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join('_');
}

export default function ChatPage() {
  const isMobile = useIsMobile();
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<ChatContact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true);
      try {
        const suggestions = await suggestUsersByLocation({
          latitude: 37.7749,
          longitude: -122.4194,
        });
        const filteredUsers = suggestions.filter((u) => u.userId !== user?.uid);
        setContacts(filteredUsers as UserProfile[]);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load user suggestions for chat.",
        });
      } finally {
        setUsersLoading(false);
      }
    };
    if (user?.uid) {
      fetchUsers();
    }
  }, [user?.uid, toast]);

  const chatId = useMemo(() => {
    if (!user || !selectedChat) return null;
    return getChatId(user.uid, selectedChat.id);
  }, [user, selectedChat]);

  const messagesCollection = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return collection(firestore, 'chats', chatId, 'messages');
  }, [firestore, chatId]);

  const { data: messagesData, isLoading: messagesLoading } = useCollection<Message>(messagesCollection, {
    orderBy: ['timestamp', 'asc']
  });

  const messages: Message[] = useMemo(() => {
    if (!messagesData) return [];
    return messagesData.map(msg => ({
      ...msg,
      own: msg.senderId === user?.uid,
    }));
  }, [messagesData, user?.uid]);

  const getLastMessage = (contactId: string): { text: string; time: string } => {
    // This is a mock implementation since we don't have a direct query for the last message
    // In a real app, you might store the last message on the contact/chat document itself.
    const lastMsg = messagesData?.slice().reverse().find(m => 
        (m.senderId === user?.uid && getChatId(m.senderId, contactId) === chatId) ||
        (m.senderId === contactId && getChatId(m.senderId, user?.uid || '') === chatId)
    );
  
    if (lastMsg) {
      return {
        text: lastMsg.mediaUrl ? 'Photo' : lastMsg.text,
        time: getTimeString(lastMsg.timestamp)
      };
    }
    return { text: 'Click to start chatting!', time: '' };
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('div:first-child');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!isMobile && contacts && contacts.length > 0 && !selectedChat) {
      const firstContact = contacts.find(c => c.id !== user?.uid);
      if (firstContact) {
        handleSelectChat(firstContact);
      }
    }
  }, [contacts, isMobile, selectedChat, user]);

  const handleSelectChat = (contact: UserProfile) => {
    setSelectedChat({
      ...contact,
      lastMessage: 'Click to start chatting!',
    });
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user || !messagesCollection) return;

    addDocumentNonBlocking(messagesCollection, {
      text: newMessage,
      senderId: user.uid,
      timestamp: serverTimestamp(),
      messageType: 'text',
      mediaUrl: null,
    });

    setNewMessage('');
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !storage || !user || !messagesCollection) {
      return;
    }

    const file = event.target.files[0];
    if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please select an image file."
        });
        return;
    }

    setIsUploading(true);

    try {
      const storageRef = ref(storage, `chat_media/${chatId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDocumentNonBlocking(messagesCollection, {
        text: '',
        senderId: user.uid,
        timestamp: serverTimestamp(),
        messageType: 'image',
        mediaUrl: downloadURL,
      });

    } catch (error) {
      console.error("File upload failed:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Could not upload your file. Please try again.",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
              <div key={`skeleton-${i}`} className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted-foreground/20 animate-pulse" />
                <div className="flex-grow space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted-foreground/20 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-muted-foreground/20 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          contacts?.map((contact) => {
             const lastMessageInfo = getLastMessage(contact.id);
            return (
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
                    {lastMessageInfo.text}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {lastMessageInfo.time}
                </div>
              </div>
            );
        })
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
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={cn(
                'flex max-w-[75%] gap-2',
                msg.own ? 'ml-auto flex-row-reverse' : 'mr-auto',
              )}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={`https://picsum.photos/seed/${msg.senderId}/200`}
                />
                <AvatarFallback>
                  {msg.own && user
                    ? user.displayName?.charAt(0)
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
                  {msg.messageType === 'image' && msg.mediaUrl ? (
                    <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
                      <Image src={msg.mediaUrl} alt="Sent image" width={200} height={200} className="rounded-md object-cover"/>
                    </a>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
                <p
                  className={cn(
                    'text-xs text-muted-foreground mt-1',
                    msg.own ? 'text-right' : 'text-left'
                  )}
                >
                   {getTimeString(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
           {isUploading && (
             <div className="flex max-w-[75%] gap-2 ml-auto flex-row-reverse opacity-50">
               <Avatar className="w-8 h-8">
                 <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
                 <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
               </Avatar>
               <div className="flex flex-col">
                 <div className="rounded-lg p-3 text-sm bg-primary text-primary-foreground rounded-br-none">
                   <div className="flex items-center gap-2">
                     <ImageIcon className="w-4 h-4 animate-pulse" />
                     <p>Uploading image...</p>
                   </div>
                 </div>
               </div>
             </div>
           )}
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
            disabled={!selectedChat || isUploading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <Button variant="ghost" size="icon" type="button" onClick={handleAttachmentClick} disabled={!selectedChat || isUploading}>
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" type="button" disabled>
              <Mic className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              className="bg-accent hover:bg-accent/90"
              type="submit"
              disabled={!selectedChat || !newMessage.trim() || isUploading}
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
