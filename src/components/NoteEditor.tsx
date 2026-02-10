"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block";
import { Note, CategoryItem, getCategoryStyle } from "@/types/note";
import CodeBlockView from "./CodeBlockView";

const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});

interface NoteEditorProps {
  note: Note;
  categories: CategoryItem[];
  onChange: (data: Partial<Pick<Note, "title" | "content" | "categoryId">>) => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 text-sm transition-colors ${
        isActive
          ? "bg-blue-100 text-blue-700"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      }`}
    >
      {children}
    </button>
  );
}

export default function NoteEditor({ note, categories, onChange }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [categoryId, setCategoryId] = useState(note.categoryId);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const debouncedChange = useCallback(
    (data: Partial<Pick<Note, "title" | "content" | "categoryId">>) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(data), 300);
    },
    [onChange]
  );

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CustomCodeBlock,
      Placeholder.configure({ placeholder: "写点什么..." }),
    ],
    content: note.content || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      debouncedChange({ content: editor.getHTML() });
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none outline-none min-h-[calc(100vh-280px)] text-gray-600",
      },
    },
  });

  const handleTitleChange = (val: string) => {
    setTitle(val);
    debouncedChange({ title: val });
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    onChange({ categoryId: id });
  };

  return (
    <div className="flex h-full flex-col">
      {/* 顶部：分类选择 */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
        <div className="flex items-center gap-2">
          {categories.map((c) => {
            const style = getCategoryStyle(c.color);
            return (
              <button
                key={c.id}
                onClick={() => handleCategoryChange(c.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  categoryId === c.id
                    ? `${style.bg} ${style.text}`
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-gray-300">自动保存</span>
      </div>

      {/* 格式工具栏 */}
      {editor && (
        <div className="flex items-center gap-0.5 border-b border-gray-100 px-6 py-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="标题 1"
          >
            <span className="font-bold">H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="标题 2"
          >
            <span className="font-bold">H2</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="标题 3"
          >
            <span className="font-bold">H3</span>
          </ToolbarButton>

          <div className="mx-1.5 h-4 w-px bg-gray-200" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="加粗"
          >
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="斜体"
          >
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="删除线"
          >
            <span className="line-through">S</span>
          </ToolbarButton>

          <div className="mx-1.5 h-4 w-px bg-gray-200" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="无序列表"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="有序列表"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <text x="2" y="8" fontSize="7" fontWeight="bold">1.</text>
              <text x="2" y="15" fontSize="7" fontWeight="bold">2.</text>
              <text x="2" y="22" fontSize="7" fontWeight="bold">3.</text>
              <line x1="12" y1="5" x2="22" y2="5" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="19" x2="22" y2="19" stroke="currentColor" strokeWidth="2" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="引用"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
          </ToolbarButton>

          <div className="mx-1.5 h-4 w-px bg-gray-200" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive("code")}
            title="行内代码"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            title="代码块"
          >
            <span className="font-mono text-xs">{"{}"}</span>
          </ToolbarButton>

          <div className="mx-1.5 h-4 w-px bg-gray-200" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="分割线"
          >
            <span className="text-xs">—</span>
          </ToolbarButton>
        </div>
      )}

      {/* 编辑区域 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="输入标题..."
          className="mb-4 w-full text-2xl font-bold text-gray-800 outline-none placeholder:text-gray-300"
          autoFocus
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
