"use client";

import { Note, CategoryItem, getCategoryStyle } from "@/types/note";

interface NoteCardProps {
  note: Note;
  categories: CategoryItem[];
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

export default function NoteCard({ note, categories, isActive, onClick, onDelete }: NoteCardProps) {
  const cat = categories.find((c) => c.id === note.categoryId);
  const style = cat ? getCategoryStyle(cat.color) : null;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border p-4 transition-all ${
        isActive
          ? "border-blue-200 bg-blue-50/50 shadow-sm"
          : "border-transparent hover:border-gray-200 hover:bg-gray-50/80"
      }`}
    >
      <div className="mb-2 flex items-start justify-between">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">
          {note.title || "无标题"}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-2 shrink-0 rounded p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          title="删除"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      {note.content && (
        <p className="mb-3 text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {stripHtml(note.content)}
        </p>
      )}
      <div className="flex items-center justify-between">
        {cat && style ? (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
            {cat.name}
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
            未分类
          </span>
        )}
        <span className="text-[10px] text-gray-300">{formatTime(note.updatedAt)}</span>
      </div>
    </div>
  );
}
