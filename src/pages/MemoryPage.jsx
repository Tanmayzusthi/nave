import { Brain, Sparkles, Clock, Shield, Trash2, Edit2, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const MemoryPage = () => {
  const permanentMemories = [
    { id: 1, content: "Prefers concise, technical explanations for architecture questions.", category: "Preferences" },
    { id: 2, content: "Currently working on 'Project Nave' using React and Tailwind.", category: "Context" },
    { id: 3, content: "Always use metric units in calculations.", category: "Rules" },
  ];

  const recentMemories = [
    { id: 4, content: "Recently asked about Vercel deployment strategies.", time: "2 hours ago" },
    { id: 5, content: "Mentioned a meeting with Stakeholders tomorrow at 10 AM.", time: "5 hours ago" },
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-8">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8" /> Nave Memory
          </h1>
          <p className="text-neutral-400">Manage what Nave remembers about you to improve personalization.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Memory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Card className="p-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
          <Sparkles className="w-6 h-6 mb-4 text-white" />
          <h3 className="font-semibold mb-2">Personalized</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">Nave adapts to your style, preferences, and workflows over time.</p>
        </Card>
        <Card className="p-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
          <Clock className="w-6 h-6 mb-4 text-white" />
          <h3 className="font-semibold mb-2">Context-Aware</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">Recent conversations are automatically indexed for better continuity.</p>
        </Card>
        <Card className="p-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
          <Shield className="w-6 h-6 mb-4 text-white" />
          <h3 className="font-semibold mb-2">Private & Secure</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">Your memory is encrypted and never used for training without permission.</p>
        </Card>
      </div>

      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold">Permanent Memory</h2>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-neutral-400">CORE</span>
          </div>
          <div className="grid gap-4">
            {permanentMemories.map((m) => (
              <div key={m.id} className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest w-20">{m.category}</span>
                  <p className="text-sm text-neutral-200">{m.content}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit2 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-500 hover:text-white"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold">Recent Context</h2>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-neutral-400">AUTO</span>
          </div>
          <div className="grid gap-4">
            {recentMemories.map((m) => (
              <div key={m.id} className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest w-20">{m.time}</span>
                  <p className="text-sm text-neutral-400">{m.content}</p>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-3 text-xs">Make Permanent</Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MemoryPage;
