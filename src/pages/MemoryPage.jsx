import { useEffect, useMemo, useState } from 'react';
import { Brain, Sparkles, Clock, Shield, Trash2, Edit2, Plus, X } from 'lucide-react';
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
import { Card } from '../components/ui/Card';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  type: 'permanent',
  title: '',
  content: ''
};

const MemoryPage = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState('');
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const memoriesQuery = query(
      collection(db, 'memories'),
      where('userId', '==', user.uid)
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

        setMemories(data);
        setError('');
        setLoadedUserId(user.uid);
      },
      (firestoreError) => {
        console.error('Firestore Error:', firestoreError);
        setError('Could not load memories. Check your Firestore rules and connection.');
        setLoadedUserId(user.uid);
      }
    );

    return unsubscribe;
  }, [user]);

  const permanentMemories = useMemo(
    () => memories.filter((memory) => memory.type === 'permanent'),
    [memories]
  );

  const temporaryMemories = useMemo(
    () => memories.filter((memory) => memory.type === 'temporary' || memory.type === 'auto'),
    [memories]
  );

  const isLoading = Boolean(user && loadedUserId !== user.uid);
  const isEditing = Boolean(editingId);

  const openAddEditor = () => {
    setEditingId(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  const openEditEditor = (memory) => {
    setEditingId(memory.id);
    setForm({
      type: memory.type || 'permanent',
      title: memory.title || '',
      content: memory.content || ''
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveMemory = async (event) => {
    event.preventDefault();

    if (!user) return;

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      setError('Memory title and content are required.');
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'memories', editingId), {
          type: form.type,
          title,
          content
        });
      } else {
        await addDoc(collection(db, 'memories'), {
          userId: user.uid,
          type: form.type,
          title,
          content,
          createdAt: serverTimestamp()
        });
      }

      closeEditor();
    } catch (saveError) {
      console.error(saveError);
      setError(isEditing ? 'Could not update memory.' : 'Could not add memory.');
    }
  };

  const deleteMemory = async (memoryId) => {
    try {
      await deleteDoc(doc(db, 'memories', memoryId));
    } catch (deleteError) {
      console.error(deleteError);
      setError('Could not delete memory.');
    }
  };

  const makePermanent = async (memoryId) => {
    try {
      await updateDoc(doc(db, 'memories', memoryId), {
        type: 'permanent'
      });
    } catch (updateError) {
      console.error(updateError);
      setError('Could not update memory type.');
    }
  };

  const renderMemoryList = (items, variant) => {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-neutral-500">
          No {variant === 'permanent' ? 'permanent' : 'temporary'} memories yet.
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {items.map((memory) => (
          <div
            key={memory.id}
            className="group flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1 sm:flex sm:items-start sm:gap-4">
              <span className="mb-2 block w-fit rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 sm:mb-0 sm:w-24 sm:bg-transparent sm:px-0">
                {variant === 'permanent' ? 'Core' : 'Auto'}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-neutral-100">
                  {memory.title || 'Untitled Memory'}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                  {memory.content}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 self-end opacity-100 transition-opacity sm:self-center sm:opacity-0 sm:group-hover:opacity-100">
              {variant === 'temporary' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => makePermanent(memory.id)}
                >
                  Make Permanent
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => openEditEditor(memory)}
                aria-label="Edit memory"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-neutral-500 hover:text-white"
                onClick={() => deleteMemory(memory.id)}
                aria-label="Delete memory"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        Sign in to manage memory.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        Loading Memory...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12">
      <div className="mb-10 flex flex-col gap-5 sm:mb-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
            <Brain className="h-8 w-8" /> Nave Memory
          </h1>
          <p className="max-w-2xl text-neutral-400">
            Manage what Nave remembers about you to improve personalization.
          </p>
        </div>
        <Button className="h-10 gap-2 self-start sm:self-auto" onClick={openAddEditor}>
          <Plus className="h-4 w-4" /> Add Memory
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {editorOpen && (
        <form
          onSubmit={saveMemory}
          className="mb-10 rounded-2xl border border-white/10 bg-neutral-950/70 p-5 shadow-2xl shadow-black/20"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {isEditing ? 'Edit Memory' : 'Add Memory'}
              </h2>
              <p className="text-xs text-neutral-500">
                Store useful context Nave can use later.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={closeEditor}
              aria-label="Close editor"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Type
              </label>
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-white/20"
              >
                <option className="bg-neutral-950" value="permanent">Permanent</option>
                <option className="bg-neutral-950" value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Title
              </label>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/20"
                placeholder="Preference, project context, rule..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Content
              </label>
              <textarea
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-neutral-600 focus:border-white/20"
                placeholder="What should Nave remember?"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={closeEditor}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save Changes' : 'Create Memory'}
            </Button>
          </div>
        </form>
      )}

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
        <Card className="p-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
          <Sparkles className="w-6 h-6 mb-4 text-white" />
          <h3 className="font-semibold mb-2">Personalized</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">Nave adapts to your style, preferences, and workflows over time.</p>
        </Card>
        <Card className="p-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
          <Clock className="w-6 h-6 mb-4 text-white" />
          <h3 className="font-semibold mb-2">Context-Aware</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">Temporary context can be promoted when it becomes useful long-term.</p>
        </Card>
        <Card className="p-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent">
          <Shield className="w-6 h-6 mb-4 text-white" />
          <h3 className="font-semibold mb-2">Private & Secure</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">Memories are scoped to your account and synced through your Firebase project.</p>
        </Card>
      </div>

      <div className="space-y-12">
        <section>
          <div className="mb-6 flex items-center gap-2">
            <h2 className="text-xl font-bold">Permanent Memory</h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-400">CORE</span>
          </div>
          {renderMemoryList(permanentMemories, 'permanent')}
        </section>

        <section>
          <div className="mb-6 flex items-center gap-2">
            <h2 className="text-xl font-bold">Auto Memory</h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-400">AUTO</span>
          </div>
          {renderMemoryList(temporaryMemories, 'temporary')}
        </section>
      </div>
    </div>
  );
};

export default MemoryPage;
