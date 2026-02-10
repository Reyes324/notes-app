"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Note } from "@/types/note";

const STORAGE_KEY = "notes-app-data";

async function fetchNotes(): Promise<Note[]> {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

async function saveRemote(notes: Note[]) {
  await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notes),
  });
}

function loadLocal(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const savingRef = useRef(false);

  // Load: try remote first, fallback to localStorage, auto-migrate
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchNotes();
        if (cancelled) return;

        if (remote.length > 0) {
          setNotes(remote);
        } else {
          // Remote empty — migrate localStorage data if any
          const local = loadLocal();
          if (local.length > 0) {
            setNotes(local);
            await saveRemote(local);
          }
        }
      } catch {
        // Offline — fall back to localStorage
        if (!cancelled) setNotes(loadLocal());
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Save to remote + localStorage on every change
  useEffect(() => {
    if (!loaded || savingRef.current) return;
    savingRef.current = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    saveRemote(notes).catch(() => {}).finally(() => { savingRef.current = false; });
  }, [notes, loaded]);

  const addNote = useCallback(
    (data: Pick<Note, "title" | "content" | "categoryId">) => {
      const now = Date.now();
      const note: Note = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [note, ...prev]);
      return note;
    },
    []
  );

  const updateNote = useCallback(
    (id: string, data: Partial<Pick<Note, "title" | "content" | "categoryId">>) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...data, updatedAt: Date.now() } : n
        )
      );
    },
    []
  );

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const filterNotes = useCallback(
    (categoryId: string | null, search: string) => {
      return notes.filter((n) => {
        const matchCategory = !categoryId || n.categoryId === categoryId;
        const q = search.trim().toLowerCase();
        const matchSearch =
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().replace(/<[^>]*>/g, "").includes(q);
        return matchCategory && matchSearch;
      });
    },
    [notes]
  );

  return { notes, loaded, addNote, updateNote, deleteNote, filterNotes };
}
