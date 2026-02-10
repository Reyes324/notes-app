"use client";

import { useState, useMemo, useCallback } from "react";
import { getCategoryStyle, CATEGORY_COLORS_PALETTE } from "@/types/note";
import { useNotes } from "@/hooks/useNotes";
import { useCategories } from "@/hooks/useCategories";
import NoteCard from "@/components/NoteCard";
import NoteEditor from "@/components/NoteEditor";

export default function Home() {
  const { notes, loaded: notesLoaded, addNote, updateNote, deleteNote, filterNotes } = useNotes();
  const { categories, loaded: catsLoaded, addCategory, updateCategory, deleteCategory } = useCategories();

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null); // null = 全部
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 分类管理状态
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<string | null>(null);

  const filteredNotes = useMemo(
    () => filterNotes(activeCategoryId, search),
    [filterNotes, activeCategoryId, search]
  );

  const editingNote = useMemo(
    () => (editingId ? notes.find((n) => n.id === editingId) ?? null : null),
    [notes, editingId]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notes) {
      counts[n.categoryId] = (counts[n.categoryId] || 0) + 1;
    }
    return counts;
  }, [notes]);

  const handleNew = () => {
    const defaultCatId = activeCategoryId ?? categories[0]?.id ?? "";
    const note = addNote({ title: "", content: "", categoryId: defaultCatId });
    setEditingId(note.id);
  };

  const handleChange = useCallback(
    (data: Parameters<typeof updateNote>[1]) => {
      if (editingId) updateNote(editingId, data);
    },
    [editingId, updateNote]
  );

  const handleDelete = (id: string) => {
    deleteNote(id);
    setDeleteConfirm(null);
    if (editingId === id) setEditingId(null);
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    addCategory(name);
    setNewCatName("");
    setIsAddingCat(false);
  };

  const handleSaveEditCat = () => {
    const name = editingCatName.trim();
    if (!name || !editingCatId) return;
    updateCategory(editingCatId, { name });
    setEditingCatId(null);
    setEditingCatName("");
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    setDeleteCatConfirm(null);
    if (activeCategoryId === id) setActiveCategoryId(null);
  };

  if (!notesLoaded || !catsLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-lg font-bold text-gray-800">记事本</h1>
          <p className="mt-1 text-xs text-gray-400">记录每一个灵感</p>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={handleNew}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            新建笔记
          </button>
        </div>

        {/* 分类列表 */}
        <nav className="flex-1 overflow-auto px-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              分类
            </span>
            <button
              onClick={() => setIsAddingCat(true)}
              className="rounded p-0.5 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-500"
              title="新增分类"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* 全部 */}
          <button
            onClick={() => setActiveCategoryId(null)}
            className={`mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
              activeCategoryId === null
                ? "bg-blue-50 font-medium text-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              全部
            </span>
            <span
              className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-medium ${
                activeCategoryId === null
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {notes.length}
            </span>
          </button>

          {/* 各分类 */}
          {categories.map((cat) => {
            const style = getCategoryStyle(cat.color);
            const isEditing = editingCatId === cat.id;

            if (isEditing) {
              return (
                <div key={cat.id} className="mb-0.5 flex items-center gap-1 px-1">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                  <input
                    type="text"
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEditCat();
                      if (e.key === "Escape") setEditingCatId(null);
                    }}
                    className="min-w-0 flex-1 rounded border border-blue-300 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-300"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEditCat}
                    className="rounded p-1 text-blue-600 hover:bg-blue-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              );
            }

            return (
              <div key={cat.id} className="group relative">
                <button
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                    activeCategoryId === cat.id
                      ? `${style.activeBg} font-medium ${style.text}`
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                    {cat.name}
                  </span>
                  <span
                    className={`min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-medium transition-opacity group-hover:opacity-0 ${
                      activeCategoryId === cat.id
                        ? `${style.bg} ${style.text}`
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {categoryCounts[cat.id] || 0}
                  </span>
                </button>
                {/* 编辑/删除按钮 */}
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCatId(cat.id);
                      setEditingCatName(cat.name);
                    }}
                    className="rounded p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-500"
                    title="编辑"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteCatConfirm(cat.id);
                    }}
                    className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                    title="删除"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          {/* 新增分类输入 */}
          {isAddingCat && (
            <div className="mb-0.5 flex items-center gap-1 px-1">
              <span className="h-2 w-2 shrink-0 rounded-full bg-gray-300" />
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory();
                  if (e.key === "Escape") {
                    setIsAddingCat(false);
                    setNewCatName("");
                  }
                }}
                placeholder="分类名称"
                className="min-w-0 flex-1 rounded border border-blue-300 px-2 py-1.5 text-sm outline-none placeholder:text-gray-300 focus:ring-1 focus:ring-blue-300"
                autoFocus
              />
              <button
                onClick={handleAddCategory}
                className="rounded p-1 text-blue-600 hover:bg-blue-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => { setIsAddingCat(false); setNewCatName(""); }}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </nav>

        <div className="border-t border-gray-100 px-5 py-4">
          <p className="text-[11px] text-gray-400">
            共 {notes.length} 条笔记
          </p>
        </div>
      </aside>

      {/* 笔记列表 */}
      <div className="flex w-80 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索笔记..."
              className="w-full rounded-lg bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-300 focus:bg-gray-100"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-300 hover:text-gray-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-3 py-2">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 text-4xl">{search ? "🔍" : "📝"}</div>
              <p className="text-sm text-gray-400">
                {search ? "没有找到匹配的笔记" : "还没有笔记，点击新建开始吧"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotes.map((note) => (
                <div key={note.id} className="relative">
                  <NoteCard
                    note={note}
                    categories={categories}
                    isActive={editingId === note.id}
                    onClick={() => setEditingId(note.id)}
                    onDelete={() => setDeleteConfirm(note.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 编辑区域 */}
      <main className="flex-1 bg-white">
        {editingNote ? (
          <NoteEditor
            key={editingId}
            note={editingNote}
            categories={categories}
            onChange={handleChange}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl">📝</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-700">
              选择或新建一条笔记
            </h2>
            <p className="text-sm text-gray-400">
              从左侧选择一条笔记编辑，或点击"新建笔记"开始写作
            </p>
          </div>
        )}
      </main>

      {/* 删除笔记确认 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-80 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-gray-800">确认删除</h3>
            <p className="mb-5 text-sm text-gray-500">删除后将无法恢复，确定要删除这条笔记吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50">取消</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600">删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除分类确认 */}
      {deleteCatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-80 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-gray-800">删除分类</h3>
            <p className="mb-5 text-sm text-gray-500">
              删除分类后，该分类下的笔记不会被删除，只是变为"未分类"状态。
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCatConfirm(null)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50">取消</button>
              <button onClick={() => handleDeleteCategory(deleteCatConfirm)} className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
