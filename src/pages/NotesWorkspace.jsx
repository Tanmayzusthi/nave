import { useEffect, useState } from 'react';
import { Plus, ChevronRight, Trash2, StickyNote } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

const NotesWorkspace = () => {
  const { user } = useAuth();

  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadedUserId, setLoadedUserId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data()
          }))
          .sort((a, b) => {
            const bTime = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
            const aTime = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
          });

        setNotes(data);
        setError('');
        setLoadedUserId(user.uid);
        setSelectedId((currentId) => {
          if (currentId && data.some((note) => note.id === currentId)) {
            return currentId;
          }

          return data[0]?.id ?? null;
        });
      },
      (firestoreError) => {
        console.error('Firestore Error:', firestoreError);
        setError('Could not load notes. Check your Firestore rules and connection.');
        setLoadedUserId(user.uid);
      }
    );

    return unsubscribe;
  }, [user]);

  const addNote = async () => {
    if (!user) return;

    try {
      const newDoc = await addDoc(collection(db, 'notes'), {
        userId: user.uid,
        title: 'Untitled Note',
        content: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSelectedId(newDoc.id);
    } catch (error) {
      console.error(error);
      setError('Could not create the note.');
    }
  };

  const updateNote = async (field, value) => {
    if (!selectedId) return;

    setNotes((prev) =>
      prev.map((note) =>
        note.id === selectedId
          ? { ...note, [field]: value }
          : note
      )
    );

    try {
      const noteRef = doc(db, 'notes', selectedId);

      await updateDoc(noteRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
      setError('Could not save the note.');
    }
  };

  const deleteNoteHandler = async () => {
    if (!selectedId) return;

    const noteId = selectedId;
    const nextNotes = notes.filter((note) => note.id !== noteId);
    setNotes(nextNotes);
    setSelectedId(nextNotes[0]?.id ?? null);

    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (error) {
      console.error(error);
      setError('Could not delete the note.');
    }
  };

  const selectedNote = notes.find((note) => note.id === selectedId);
  const isLoading = Boolean(user && loadedUserId !== user.uid);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        Sign in to use notes.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        Loading Notes...
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/5 bg-neutral-950/20 flex flex-col">
        <div className="p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Workspace
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={addNote}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedId(note.id)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm cursor-pointer truncate transition-all',
                selectedId === note.id
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <StickyNote className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{note.title || 'Untitled Note'}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>Notes</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">
              {selectedNote ? selectedNote.title || 'Untitled Note' : 'No Note'}
            </span>
          </div>

          {selectedNote && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={deleteNoteHandler}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {error && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-8 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {selectedNote ? (
          <div className="max-w-3xl mx-auto py-20 px-12 w-full">
            <input
              value={selectedNote.title || ''}
              onChange={(e) =>
                updateNote('title', e.target.value)
              }
              className="text-5xl font-bold bg-transparent border-none outline-none w-full mb-8 text-white"
              placeholder="Untitled"
            />

            <textarea
              value={selectedNote.content || ''}
              onChange={(e) =>
                updateNote('content', e.target.value)
              }
              className="w-full min-h-[400px] bg-transparent outline-none resize-none text-lg text-neutral-300"
              placeholder="Start writing..."
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500">
            No notes yet. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesWorkspace;
