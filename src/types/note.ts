export interface CategoryItem {
  id: string;
  name: string;
  color: string; // tailwind bg class like "bg-blue-100"
}

export const CATEGORY_COLORS_PALETTE = [
  { bg: "bg-blue-100", text: "text-blue-700", activeBg: "bg-blue-50", dot: "bg-blue-400" },
  { bg: "bg-orange-100", text: "text-orange-700", activeBg: "bg-orange-50", dot: "bg-orange-400" },
  { bg: "bg-purple-100", text: "text-purple-700", activeBg: "bg-purple-50", dot: "bg-purple-400" },
  { bg: "bg-green-100", text: "text-green-700", activeBg: "bg-green-50", dot: "bg-green-400" },
  { bg: "bg-pink-100", text: "text-pink-700", activeBg: "bg-pink-50", dot: "bg-pink-400" },
  { bg: "bg-cyan-100", text: "text-cyan-700", activeBg: "bg-cyan-50", dot: "bg-cyan-400" },
  { bg: "bg-amber-100", text: "text-amber-700", activeBg: "bg-amber-50", dot: "bg-amber-400" },
  { bg: "bg-rose-100", text: "text-rose-700", activeBg: "bg-rose-50", dot: "bg-rose-400" },
];

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "cat-1", name: "个人", color: "bg-blue-100" },
  { id: "cat-2", name: "工作", color: "bg-orange-100" },
  { id: "cat-3", name: "灵感", color: "bg-purple-100" },
  { id: "cat-4", name: "日记", color: "bg-green-100" },
];

export function getCategoryStyle(color: string) {
  return (
    CATEGORY_COLORS_PALETTE.find((p) => p.bg === color) ?? CATEGORY_COLORS_PALETTE[0]
  );
}

export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  createdAt: number;
  updatedAt: number;
}
