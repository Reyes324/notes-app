"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CategoryItem,
  DEFAULT_CATEGORIES,
  CATEGORY_COLORS_PALETTE,
} from "@/types/note";

const STORAGE_KEY = "notes-app-categories";

async function fetchCategories(): Promise<CategoryItem[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

async function saveRemote(categories: CategoryItem[]) {
  await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(categories),
  });
}

function loadLocal(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    return parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const savingRef = useRef(false);

  // Load: try remote first, fallback to localStorage, auto-migrate
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchCategories();
        if (cancelled) return;

        if (remote.length > 0) {
          setCategories(remote);
        } else {
          // Remote empty — migrate localStorage data
          const local = loadLocal();
          setCategories(local);
          await saveRemote(local);
        }
      } catch {
        // Offline — fall back to localStorage
        if (!cancelled) setCategories(loadLocal());
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // Save to remote + localStorage on every change
  useEffect(() => {
    if (!loaded || savingRef.current) return;
    savingRef.current = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    saveRemote(categories).catch(() => {}).finally(() => { savingRef.current = false; });
  }, [categories, loaded]);

  const addCategory = useCallback((name: string) => {
    const colorIndex =
      Math.floor(Math.random() * CATEGORY_COLORS_PALETTE.length);
    const cat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name,
      color: CATEGORY_COLORS_PALETTE[colorIndex].bg,
    };
    setCategories((prev) => [...prev, cat]);
    return cat;
  }, []);

  const updateCategory = useCallback(
    (id: string, data: Partial<Pick<CategoryItem, "name" | "color">>) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
    },
    []
  );

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, loaded, addCategory, updateCategory, deleteCategory };
}
