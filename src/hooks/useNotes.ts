"use client";

import { useState, useEffect, useCallback } from "react";
import { Note } from "@/types/note";

const STORAGE_KEY = "notes-app-data";

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNotes(loadNotes());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveNotes(notes);
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
