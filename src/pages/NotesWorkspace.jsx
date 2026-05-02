import { useState } from 'react';
import { 
  Plus, 
  FileText, 
  ChevronRight, 
  MoreHorizontal, 
  Search,
  Layout,
  Type,
  Image as ImageIcon,
  Link2,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

const NotesWorkspace = () => {
  const [selectedNote, setSelectedNote] = useState('Introduction to Nave OS');
  
  const notes = [
    { id: 1, title: 'Introduction to Nave OS', emoji: '🚀' },
    { id: 2, title: 'Product Roadmap Q3', emoji: '📅' },
    { id: 3, title: 'Architecture Decisions', emoji: '🏗️' },
    { id: 4, title: 'Market Research', emoji: '📊' },
  ];

  return (
    <div className="flex h-full">
      {/* Notes Sidebar */}
      <div className="w-64 border-r border-white/5 bg-neutral-950/20 flex flex-col">
        <div className="p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Workspace</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-md">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note.title)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all group",
                selectedNote === note.title ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="text-base">{note.emoji}</span>
              <span className="truncate">{note.title}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>Notes</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{selectedNote}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Share</Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-20 px-12">
            <input 
              value={selectedNote}
              onChange={(e) => setSelectedNote(e.target.value)}
              className="text-5xl font-bold bg-transparent border-none focus:ring-0 w-full mb-8 placeholder:text-neutral-800"
              placeholder="Untitled"
            />
            
            <div className="space-y-6">
              <div className="group relative">
                <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Plus className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Layout className="w-3 h-3" /></Button>
                </div>
                <p className="text-lg text-neutral-300 leading-relaxed outline-none" contentEditable>
                  Nave OS is more than just a chat interface. It's a comprehensive environment where your thoughts are captured, organized, and enhanced by AI. 
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Summary
                </h3>
                <p className="text-neutral-300 text-sm italic">
                  "This document outlines the core philosophy of Nave OS, focusing on the integration of human intuition and artificial intelligence."
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4 text-neutral-500">
                  <Type className="w-4 h-4" />
                  <span className="text-sm">Click here to start writing or type '/' for commands...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesWorkspace;
