import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Loader2 } from 'lucide-react';

export const VoiceMode = ({ onClose, onComplete, messages = [], memories = [] }) => {
  const [status, setStatus] = useState('idle'); // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Your browser does not support Speech Recognition. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
        setError(`Microphone error: ${event.error}`);
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startListening = () => {
    setError('');
    setTranscript('');
    setStatus('listening');
    if (audioRef.current) {
      audioRef.current.pause();
    }
    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.error(e);
    }
  };

  const stopListeningAndProcess = async () => {
    if (status !== 'listening') return;
    setStatus('processing');
    try {
      recognitionRef.current?.stop();
    } catch (e) {}

    const finalTranscript = transcript.trim();
    if (!finalTranscript) {
      setStatus('idle');
      return;
    }

    try {
      // 1. Get AI Reply
      const chatPayload = {
        messages: [...messages, { role: 'user', content: finalTranscript }],
        memories
      };

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatPayload)
      });
      
      const chatData = await chatRes.json();
      if (!chatRes.ok || chatData.error) throw new Error(chatData.error || 'Chat API failed');
      
      const aiReply = chatData.reply;

      // 2. Report back to Workspace to add to visual chat
      onComplete(finalTranscript, aiReply);

      // 3. Get TTS Audio
      setStatus('speaking');
      setTranscript(aiReply);
      
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiReply })
      });

      if (!ttsRes.ok) throw new Error('TTS API failed');

      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setStatus('idle');
        setTranscript('');
      };
      
      await audio.play();

    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during processing.');
      setStatus('idle');
    }
  };

  const cancelSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setStatus('idle');
    setTranscript('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center"
          >
            {/* Animated Orb */}
            <div className="relative flex items-center justify-center w-48 h-48 mb-12">
              {status === 'listening' && (
                <motion.div 
                  className="absolute inset-0 rounded-full bg-blue-500/30 blur-3xl"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              {status === 'processing' && (
                <motion.div 
                  className="absolute inset-0 rounded-full bg-purple-500/30 blur-3xl"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              )}
              {status === 'speaking' && (
                <motion.div 
                  className="absolute inset-0 rounded-full bg-green-500/30 blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              
              <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700
                ${status === 'idle' ? 'bg-white/10' : ''}
                ${status === 'listening' ? 'bg-blue-500/20 shadow-blue-500/50' : ''}
                ${status === 'processing' ? 'bg-purple-500/20 shadow-purple-500/50' : ''}
                ${status === 'speaking' ? 'bg-green-500/20 shadow-green-500/50' : ''}
              `}>
                {status === 'idle' && <Mic className="w-12 h-12 text-white/50" />}
                {status === 'listening' && <Mic className="w-12 h-12 text-blue-400" />}
                {status === 'processing' && <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />}
                {status === 'speaking' && <div className="w-12 h-12 rounded-full bg-green-400 animate-pulse" />}
              </div>
            </div>

            {/* Transcript Text */}
            <div className="text-center max-w-xl h-32 flex items-center justify-center">
              {error ? (
                <p className="text-red-400 text-lg font-medium">{error}</p>
              ) : (
                <p className={`text-2xl font-medium leading-relaxed
                  ${status === 'speaking' ? 'text-green-50 text-opacity-90' : 'text-white/80'}
                `}>
                  {transcript || (status === 'listening' ? 'Listening...' : status === 'processing' ? 'Thinking...' : 'Tap the microphone to speak')}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="pb-16 flex items-center gap-6">
        {status === 'listening' ? (
          <button 
            onClick={stopListeningAndProcess}
            className="w-20 h-20 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="w-6 h-6 bg-white rounded-sm" /> {/* Stop square */}
          </button>
        ) : status === 'speaking' ? (
          <button 
            onClick={cancelSpeech}
            className="w-20 h-20 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all transform hover:scale-105 active:scale-95"
          >
            <MicOff className="w-8 h-8 text-white" />
          </button>
        ) : status === 'processing' ? (
           <div className="w-20 h-20 flex items-center justify-center">
             <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
           </div>
        ) : (
          <button 
            onClick={startListening}
            className="w-20 h-20 bg-white hover:bg-neutral-200 text-black rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all transform hover:scale-105 active:scale-95"
          >
            <Mic className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
};
