import { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, CheckSquare, Plus, Trash2 } from 'lucide-react';
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
import { Input } from '../components/ui/Input';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  title: '',
  dueDate: ''
};

const formatDueDate = (value) => {
  if (!value) return 'No due date';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'No due date';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((taskDoc) => ({
            id: taskDoc.id,
            ...taskDoc.data()
          }))
          .sort((a, b) => {
            if (a.completed !== b.completed) {
              return Number(a.completed) - Number(b.completed);
            }

            const aDue = a.dueDate || '9999-12-31';
            const bDue = b.dueDate || '9999-12-31';

            if (aDue !== bDue) {
              return aDue.localeCompare(bDue);
            }

            const bTime = b.createdAt?.toMillis?.() ?? 0;
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
          });

        setTasks(data);
        setError('');
        setLoadedUserId(user.uid);
      },
      (firestoreError) => {
        console.error('Firestore Error:', firestoreError);
        setError('Could not load tasks. Check your Firestore rules and connection.');
        setLoadedUserId(user.uid);
      }
    );

    return unsubscribe;
  }, [user]);

  const isLoading = Boolean(user && loadedUserId !== user.uid);
  const openTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => task.completed), [tasks]);

  const addTask = async (event) => {
    event.preventDefault();

    if (!user || isSubmitting) return;

    const title = form.title.trim();

    if (!title) {
      setError('Task title is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        title,
        dueDate: form.dueDate || null,
        completed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null
      });

      setForm(emptyForm);
      setError('');
    } catch (addError) {
      console.error(addError);
      setError('Could not add task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: !task.completed,
        completedAt: task.completed ? null : serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (updateError) {
      console.error(updateError);
      setError('Could not update task.');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (deleteError) {
      console.error(deleteError);
      setError('Could not delete task.');
    }
  };

  const renderTaskList = (items, emptyText) => {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-neutral-500">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((task) => (
          <div
            key={task.id}
            className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                onClick={() => toggleTask(task)}
                className={cn(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all',
                  task.completed
                    ? 'border-white bg-white text-black'
                    : 'border-white/10 bg-white/5 text-neutral-500 hover:border-white/20 hover:text-white'
                )}
                aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
              >
                <Check className="h-4 w-4" />
              </button>

              <div className="min-w-0">
                <h3
                  className={cn(
                    'text-sm font-semibold text-neutral-100',
                    task.completed && 'text-neutral-500 line-through'
                  )}
                >
                  {task.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDueDate(task.dueDate)}
                  </span>
                  {task.completed && (
                    <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium text-neutral-300">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-neutral-500 hover:text-white"
                onClick={() => deleteTask(task.id)}
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
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
        Sign in to manage tasks.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        Loading Tasks...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
            <CheckSquare className="h-8 w-8" /> Tasks
          </h1>
          <p className="max-w-2xl text-sm text-neutral-400 sm:text-base">
            Track what matters, sync it live, and keep your task list scoped to your account.
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-neutral-400">
          {openTasks.length} open task{openTasks.length === 1 ? '' : 's'}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={addTask}
        className="mb-8 rounded-2xl border border-white/10 bg-neutral-950/60 p-4 shadow-2xl shadow-black/20 sm:p-5"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Task
            </label>
            <Input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Finish roadmap, call client, prepare notes..."
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Due Date
            </label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </div>

          <Button type="submit" className="h-11 gap-2 md:self-end" disabled={isSubmitting}>
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        </div>
      </form>

      <div className="space-y-10">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-bold">Open</h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
              LIVE
            </span>
          </div>
          {renderTaskList(openTasks, 'No open tasks yet. Add one above to get started.')}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-bold">Completed</h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
              DONE
            </span>
          </div>
          {renderTaskList(completedTasks, 'Completed tasks will show up here.')}
        </section>
      </div>
    </div>
  );
};

export default TasksPage;
