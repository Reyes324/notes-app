"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CategoryItem,
  DEFAULT_CATEGORIES,
  CATEGORY_COLORS_PALETTE,
} from "@/types/note";

const STORAGE_KEY = "notes-app-categories";

function load(): CategoryItem[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    return parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function save(categories: CategoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCategories(load());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) save(categories);
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
