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
  Sparkles,
  PanelLeftOpen,
  X,
  Brain,
  ToggleLeft,
  ToggleRight,
  FileText,
  Image as ImageIcon,
  XCircle,
  UploadCloud,
  Mic
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
import { db } from '../lib/firebase';
import { parseFileText, compressImageToBase64 } from '../lib/fileParser';
import { useAuth } from '../context/AuthContext';
import { VoiceMode } from '../components/ui/VoiceMode';

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

const getChatResponse = async (messages, memories = []) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, memories })
  });

  const rawBody = await response.text();
  let data;

  try {
    data = rawBody
      ? JSON.parse(rawBody)
      : { error: 'Nave OS returned an empty response. Please try again.' };
  } catch {
    throw new Error('Nave OS returned an invalid response. Please try again.');
  }

  if (!response.ok || data.error) {
    throw new Error(data.error || 'Nave OS could not reach the AI service. Please try again.');
  }

  if (!data.reply) {
    throw new Error('Nave OS returned an empty response. Please try again.');
  }

  return data.reply;
};

const ChatWorkspace = () => {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [permanentMemories, setPermanentMemories] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAutoMemoryOn, setIsAutoMemoryOn] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const scrollRef = useRef(null);
  const selectedChatIdRef = useRef(null);
  const fileInputRef = useRef(null);

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
      where('type', 'in', ['permanent', 'auto'])
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

  useEffect(() => {
    setIsHistoryOpen(false);
  }, [selectedChatId]);

  const createNewChat = () => {
    setInput('');
    setAttachments([]);
    setMessages([STARTER_MESSAGE]);
    setSelectedChatId(null);
  };

  const selectChat = (chat) => {
    setSelectedChatId(chat.id);
    setMessages(chat.messages?.length ? chat.messages : [STARTER_MESSAGE]);
    setInput('');
    setAttachments([]);
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

  const handleFiles = async (files) => {
    const validFiles = Array.from(files).filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) alert('Some files were skipped (Max 5MB limit).');
    
    for (const file of validFiles) {
      const isImage = file.type.startsWith('image/');
      let textContent = null;
      let url = null;
      
      if (!isImage) {
        textContent = await parseFileText(file);
      } else {
        url = await compressImageToBase64(file);
      }
      
      const newAttachment = {
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
        type: isImage ? 'image' : 'document',
        previewUrl: isImage ? url : null,
        textContent,
        progress: 100, // Instant upload
        url
      };
      
      setAttachments(prev => [...prev, newAttachment]);
    }
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        handleFiles(e.clipboardData.files);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [user]);

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const processIncomingReply = async (replyText) => {
    let finalReply = replyText;
    const memoryMatches = [...finalReply.matchAll(/<SAVE_MEMORY title="([^"]+)">([\s\S]*?)<\/SAVE_MEMORY>/g)];
    
    if (memoryMatches.length > 0 && isAutoMemoryOn && user) {
      for (const match of memoryMatches) {
         const title = match[1];
         const content = match[2];
         
         const isDuplicate = permanentMemories.some(m => m.title === title || m.content === content);
         if (!isDuplicate) {
           await addDoc(collection(db, 'memories'), {
             userId: user.uid,
             type: 'auto',
             title,
             content,
             createdAt: serverTimestamp()
           });
         }
      }
      finalReply = finalReply.replace(/<SAVE_MEMORY[\s\S]*?<\/SAVE_MEMORY>/g, '').trim();
    }
    
    if (!finalReply) finalReply = "Memory successfully saved.";
    return finalReply;
  };

  const handleSend = async () => {
    if (loading) return;
    if (!user) {
      alert("Please login first to send messages.");
      return;
    }
    if ((!input.trim() && attachments.length === 0) || isTyping) return;

    if (attachments.some(a => a.progress < 100)) {
       alert("Please wait for uploads to finish");
       return;
    }

    let finalInput = input;
    const currentAttachments = [...attachments];
    
    currentAttachments.forEach(att => {
       if (att.type === 'document' && att.textContent) {
          finalInput += `\n\n--- Attachment: ${att.name} ---\n${att.textContent}\n---`;
       } else if (att.type === 'image') {
          finalInput += `\n\n[Image Attached: ${att.name}]`; // Multimodal placeholder
       }
    });

    const userMessage = { 
      role: 'user', 
      content: finalInput,
      displayContent: input || 'Sent an attachment',
      attachments: currentAttachments.map(a => ({ name: a.name, url: a.url, type: a.type }))
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setAttachments([]);
    setIsTyping(true);

    try {
      const relevantMemories = getRelevantMemories(permanentMemories, userMessage.content);
      let response = await getChatResponse(updatedMessages, relevantMemories);
      
      response = await processIncomingReply(response);

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

  const handleVoiceComplete = async (userText, aiReply) => {
    const userMsg = { role: 'user', content: userText };
    const processedReply = await processIncomingReply(aiReply);
    const aiMsg = { role: 'assistant', content: processedReply };
    const finalMessages = [...messages, userMsg, aiMsg];
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
  };

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden relative">
      {isVoiceModeOpen && (
        <VoiceMode 
          messages={messages} 
          memories={getRelevantMemories(permanentMemories, '')}
          onClose={() => setIsVoiceModeOpen(false)}
          onComplete={handleVoiceComplete}
        />
      )}
      
      {isHistoryOpen && (
        <button
          type="button"
          aria-label="Close chat history"
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-[min(18rem,calc(100vw-2rem))] shrink-0 flex-col border-r border-white/5 bg-neutral-950/95 p-3 backdrop-blur-xl transition-transform md:static md:z-auto md:w-64 md:translate-x-0 md:bg-neutral-950/20 md:backdrop-blur-0',
          isHistoryOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
          <span className="text-sm font-semibold text-white">Chat History</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 w-11 p-0"
            onClick={() => setIsHistoryOpen(false)}
            aria-label="Close chat history"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mb-3 h-11 justify-start gap-2"
          onClick={() => {
            createNewChat();
            setIsHistoryOpen(false);
          }}
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
                  className="min-h-11 min-w-0 flex-1 truncate text-left"
                  onClick={() => {
                    selectChat(chat);
                    setIsHistoryOpen(false);
                  }}
                >
                  {chat.title || 'New Chat'}
                </button>
                <button
                  className="shrink-0 rounded-lg p-2 text-neutral-600 opacity-100 transition-all hover:bg-white/10 hover:text-white md:opacity-0 md:group-hover:opacity-100"
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

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden px-3 sm:px-5 lg:px-6">
      <div className="mx-auto flex h-full w-full max-w-4xl min-w-0 flex-col">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 w-11 shrink-0 p-0 md:hidden"
            onClick={() => setIsHistoryOpen(true)}
            aria-label="Open chat history"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="min-w-0 gap-2 text-neutral-400">
            Nave Intelligence (2.5 Lite) <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-11 gap-2", isAutoMemoryOn ? "text-white" : "text-neutral-500")}
            onClick={() => setIsAutoMemoryOn(!isAutoMemoryOn)}
            title="Toggle Auto Memory"
          >
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">Auto Memory</span>
            {isAutoMemoryOn ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-11 gap-2"
            onClick={createNewChat}
          >
            <Plus className="w-4 h-4" /> New Chat
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-6 space-y-6 scroll-smooth sm:py-8 sm:space-y-8"
      >
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex gap-3 sm:gap-4',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex-shrink-0 flex items-center justify-center border border-white/10">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className={cn(
                'max-w-[min(85%,42rem)] break-words rounded-2xl p-3 text-sm leading-relaxed sm:p-4',
                msg.role === 'user' 
                  ? 'bg-white text-black' 
                  : 'border border-white/5 bg-neutral-900/50 text-neutral-200'
              )}>
                {msg.displayContent || msg.content}
                
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.attachments.map((att, i) => (
                      <a key={i} href={att.url} target="_blank" rel="noreferrer" className={cn("flex items-center gap-2 rounded-lg p-2 text-xs", msg.role === 'user' ? 'bg-black/5 hover:bg-black/10 text-black' : 'bg-white/5 hover:bg-white/10 text-white')}>
                        {att.type === 'image' ? (
                           <img src={att.url} alt={att.name} className="w-10 h-10 object-cover rounded" />
                        ) : (
                           <FileText className="w-4 h-4" />
                        )}
                        <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                      </a>
                    ))}
                  </div>
                )}
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
      <div className="shrink-0 pb-4 pt-4 sm:pb-8">
        <div 
          className={cn(
            "glass relative rounded-2xl border-white/10 p-2 shadow-2xl transition-all",
            isDragging ? "bg-white/10 border-white/30 ring-2 ring-white/20" : ""
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-neutral-950/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-white">
                <UploadCloud className="w-8 h-8 animate-bounce" />
                <span className="font-semibold">Drop files to upload</span>
              </div>
            </div>
          )}
          
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-2 pb-1">
              {attachments.map(att => (
                <div key={att.id} className="relative flex items-center gap-2 rounded-lg bg-white/5 p-2 pr-8 border border-white/10 text-sm text-white">
                  {att.type === 'image' && att.previewUrl ? (
                    <img src={att.previewUrl} alt={att.name} className="w-8 h-8 object-cover rounded" />
                  ) : (
                    <FileText className="w-5 h-5 text-neutral-400" />
                  )}
                  <div className="flex flex-col min-w-[100px]">
                    <span className="truncate max-w-[150px] text-xs font-medium">{att.name}</span>
                    <div className="h-1 w-full bg-white/10 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-white transition-all duration-300" style={{ width: `${att.progress}%` }} />
                    </div>
                  </div>
                  <button onClick={() => removeAttachment(att.id)} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Ask Nave OS anything..."
            className="min-h-[88px] w-full resize-none border-none bg-transparent p-3 text-sm placeholder:text-neutral-500 focus:ring-0 sm:min-h-[100px]"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 p-2">
            <div className="flex gap-2">
              <input 
                type="file" 
                multiple 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => handleFiles(e.target.files)} 
                accept="image/*,.pdf,.txt,.csv,.docx"
              />
              <Button variant="ghost" size="sm" className="h-11 w-11 rounded-lg p-0" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-4 h-4 text-neutral-500" />
              </Button>
              <Button variant="ghost" size="sm" className="h-11 w-11 rounded-lg p-0" onClick={() => setIsVoiceModeOpen(true)}>
                <Mic className="w-4 h-4 text-neutral-500 hover:text-blue-400 transition-colors" />
              </Button>
            </div>
            <Button 
              size="sm" 
              className={cn('h-11 gap-2 px-4 transition-all', input.trim() || attachments.length > 0 ? 'bg-white text-black' : 'bg-white/10 text-white/40')}
              onClick={handleSend}
              disabled={loading}
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
