import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Paperclip, 
  Send, 
  Plus, 
  ChevronDown, 
  User, 
  Bot, 
  MoreHorizontal,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { getGeminiResponse } from '../lib/gemini';

const ChatWorkspace = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I'm your Nave OS assistant. How can I help you today? I have access to your notes, tasks, and memory." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getGeminiResponse(updatedMessages);
      const assistantMessage = { 
        role: 'assistant', 
        content: response 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-6">
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
          onClick={() => setMessages([{ role: 'assistant', content: "Hello! I'm your Nave OS assistant. How can I help you today?" }])}
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
  );
};

export default ChatWorkspace;
