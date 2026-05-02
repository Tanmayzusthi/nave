import { useEffect, useState } from 'react';
import { Plus, ChevronRight, Trash2, StickyNote, PanelLeftOpen, X } from 'lucide-react';
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
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

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

  useEffect(() => {
    setIsMobileListOpen(false);
  }, [selectedId]);

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
    <div className="flex h-full min-w-0 overflow-hidden">
      {isMobileListOpen && (
        <button
          type="button"
          aria-label="Close notes list"
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setIsMobileListOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-[min(18rem,calc(100vw-2rem))] flex-col border-r border-white/5 bg-neutral-950/95 backdrop-blur-xl transition-transform lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:bg-neutral-950/20 lg:backdrop-blur-0',
          isMobileListOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-4">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Workspace
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0"
              onClick={addNote}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0 lg:hidden"
              onClick={() => setIsMobileListOpen(false)}
              aria-label="Close notes list"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => {
                setSelectedId(note.id);
                setIsMobileListOpen(false);
              }}
              className={cn(
                'cursor-pointer truncate rounded-lg px-3 py-3 text-sm transition-all',
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
      <div className="flex min-w-0 flex-1 flex-col bg-background h-full">
        <div className="flex shrink-0 min-h-16 items-center justify-between gap-3 border-b border-white/5 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2 text-sm text-neutral-500">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-11 w-11 shrink-0 p-0 lg:hidden"
              onClick={() => setIsMobileListOpen(true)}
              aria-label="Open notes list"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
            <span>Notes</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="truncate text-white">
              {selectedNote ? selectedNote.title || 'Untitled Note' : 'No Note'}
            </span>
          </div>

          {selectedNote && (
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 shrink-0 p-0"
              onClick={deleteNoteHandler}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {error && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 sm:px-6 lg:px-8">
            {error}
          </div>
        )}

        {selectedNote ? (
          <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            <input
              value={selectedNote.title || ''}
              onChange={(e) =>
                updateNote('title', e.target.value)
              }
              className="mb-6 w-full border-none bg-transparent text-3xl font-bold text-white outline-none sm:mb-8 sm:text-4xl lg:text-5xl"
              placeholder="Untitled"
            />

            <textarea
              value={selectedNote.content || ''}
              onChange={(e) =>
                updateNote('content', e.target.value)
              }
              className="min-h-[calc(100dvh-17rem)] w-full resize-none bg-transparent text-base text-neutral-300 outline-none sm:min-h-[400px] sm:text-lg"
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
