import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Paperclip, 
  Send, 
  Plus, 
  ChevronDown, 
  User, 
  Bot, 
  Trash2,
  Sparkles
} from 'lucide-react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { getNvidiaResponse } from '../lib/nvidia';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const getRelevantMemories = (memories, prompt) => {
  const words = new Set(
    prompt
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
  );

  if (words.size === 0) {
    return memories.slice(0, 3);
  }

  return memories
    .map((memory) => {
      const memoryText = `${memory.title || ''} ${memory.content || ''}`.toLowerCase();
      const score = [...words].reduce(
        (total, word) => total + (memoryText.includes(word) ? 1 : 0),
        0
      );

      return { ...memory, score };
    })
    .filter((memory) => memory.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

const STARTER_MESSAGE = {
  role: 'assistant',
  content: "Hello! I'm your Nave OS assistant. How can I help you today? I have access to your notes, tasks, and memory."
};

const getChatTitle = (messages) => {
  const firstUserMessage = messages.find((message) => message.role === 'user');

  if (!firstUserMessage) return 'New Chat';

  return firstUserMessage.content.length > 48
    ? `${firstUserMessage.content.slice(0, 48)}...`
    : firstUserMessage.content;
};

const ChatWorkspace = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [permanentMemories, setPermanentMemories] = useState([]);
  const scrollRef = useRef(null);
  const selectedChatIdRef = useRef(null);

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const memoriesQuery = query(
      collection(db, 'memories'),
      where('userId', '==', user.uid),
      where('type', '==', 'permanent')
    );

    const unsubscribe = onSnapshot(
      memoriesQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((memoryDoc) => ({
            id: memoryDoc.id,
            ...memoryDoc.data()
          }))
          .sort((a, b) => {
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
          });

        setPermanentMemories(data);
      },
      (error) => {
        console.error('Memory sync error:', error);
      }
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const chatsQuery = query(
      collection(db, 'chatSessions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((chatDoc) => ({
            id: chatDoc.id,
            ...chatDoc.data()
          }))
          .sort((a, b) => {
            const bTime = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
            const aTime = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
          });

        setChats(data);

        const currentId = selectedChatIdRef.current;
        const currentChat = data.find((chat) => chat.id === currentId);

        if (currentChat) {
          setMessages(currentChat.messages?.length ? currentChat.messages : [STARTER_MESSAGE]);
          return;
        }

        const nextChat = data[0];
        setSelectedChatId(nextChat?.id ?? null);
        setMessages(nextChat?.messages?.length ? nextChat.messages : [STARTER_MESSAGE]);
      },
      (error) => {
        console.error('Chat history sync error:', error);
      }
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createNewChat = () => {
    setInput('');
    setMessages([STARTER_MESSAGE]);
    setSelectedChatId(null);
  };

  const selectChat = (chat) => {
    setSelectedChatId(chat.id);
    setMessages(chat.messages?.length ? chat.messages : [STARTER_MESSAGE]);
    setInput('');
  };

  const deleteChat = async (chatId) => {
    try {
      await deleteDoc(doc(db, 'chatSessions', chatId));

      if (selectedChatId === chatId) {
        const nextChat = chats.find((chat) => chat.id !== chatId);
        setSelectedChatId(nextChat?.id ?? null);
        setMessages(nextChat?.messages?.length ? nextChat.messages : [STARTER_MESSAGE]);
      }
    } catch (error) {
      console.error('Delete chat error:', error);
    }
  };

  const persistMessages = async (chatId, nextMessages) => {
    if (!chatId) return;

    await updateDoc(doc(db, 'chatSessions', chatId), {
      title: getChatTitle(nextMessages),
      messages: nextMessages,
      updatedAt: serverTimestamp()
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const relevantMemories = getRelevantMemories(permanentMemories, userMessage.content);
      const response = await getNvidiaResponse(updatedMessages, relevantMemories);
      const assistantMessage = { 
        role: 'assistant', 
        content: response 
      };
      const finalMessages = [...updatedMessages, assistantMessage];

      setMessages(finalMessages);

      if (user) {
        if (selectedChatId) {
          await persistMessages(selectedChatId, finalMessages);
        } else {
          const newChat = await addDoc(collection(db, 'chatSessions'), {
            userId: user.uid,
            title: getChatTitle(finalMessages),
            messages: finalMessages,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          setSelectedChatId(newChat.id);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: error.message || 'Nave OS could not reach the AI service. Please try again.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-neutral-950/20 p-3 md:flex md:flex-col">
        <Button
          variant="outline"
          size="sm"
          className="mb-3 h-9 justify-start gap-2"
          onClick={createNewChat}
        >
          <Plus className="w-4 h-4" /> New Chat
        </Button>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-neutral-600">
              No previous chats.
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all',
                  selectedChatId === chat.id
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-500 hover:bg-white/5 hover:text-white'
                )}
              >
                <button
                  className="min-w-0 flex-1 truncate text-left"
                  onClick={() => selectChat(chat)}
                >
                  {chat.title || 'New Chat'}
                </button>
                <button
                  className="shrink-0 rounded-lg p-1 text-neutral-600 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  onClick={() => deleteChat(chat.id)}
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col px-4 sm:px-6">
      <div className="flex flex-col h-full max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-neutral-400">
            Nave Intelligence (2.5 Lite) <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={createNewChat}
        >
          <Plus className="w-4 h-4" /> New Chat
        </Button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-8 space-y-8 scroll-smooth"
      >
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/10">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-white text-black" 
                  : "bg-neutral-900/50 border border-white/5 text-neutral-200"
              )}>
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex-shrink-0 flex items-center justify-center border border-white/10">
                  <User className="w-5 h-5 text-neutral-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-4 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="pb-8 pt-4">
        <div className="relative glass rounded-2xl border-white/10 p-2 shadow-2xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Ask Nave OS anything..."
            className="w-full bg-transparent border-none focus:ring-0 text-sm p-3 min-h-[100px] resize-none placeholder:text-neutral-500"
          />
          <div className="flex items-center justify-between p-2">
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                <Paperclip className="w-4 h-4 text-neutral-500" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                <Sparkles className="w-4 h-4 text-neutral-500" />
              </Button>
            </div>
            <Button 
              size="sm" 
              className={cn("h-8 gap-2 transition-all", input.trim() ? "bg-white text-black" : "bg-white/10 text-white/40")}
              onClick={handleSend}
            >
              <Send className="w-4 h-4" /> Send
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-center text-neutral-600 mt-3 uppercase tracking-widest font-medium">
          Powered by Nave Intelligence 4.0
        </p>
      </div>
      </div>
      </div>
    </div>
  );
};

export default ChatWorkspace;
