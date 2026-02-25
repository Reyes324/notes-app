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
  onBack?: () => void;
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
      className={`rounded p-2 text-sm transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
        isActive
          ? "bg-blue-100 text-blue-700"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      }`}
    >
      {children}
    </button>
  );
}

export default function NoteEditor({ note, categories, onChange, onBack }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [categoryId, setCategoryId] = useState(note.categoryId);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const titleRef = useRef<HTMLDivElement>(null);

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
        class: "prose prose-sm max-w-none outline-none min-h-[200px] md:min-h-[calc(100vh-280px)] text-gray-600",
      },
    },
  });

  // Set initial title content
  useEffect(() => {
    if (titleRef.current && titleRef.current.textContent !== note.title) {
      titleRef.current.textContent = note.title;
    }
  }, [note.title]);

  const handleTitleInput = () => {
    if (!titleRef.current) return;
    const text = titleRef.current.textContent || "";
    setTitle(text);
    debouncedChange({ title: text });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Focus the Tiptap editor at the beginning
      if (editor) {
        editor.chain().focus("start").run();
      }
    }
  };

  const handleTitlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const lines = text.split(/\r?\n/);
    const firstLine = lines[0] || "";
    const restLines = lines.slice(1).join("\n").trim();

    // Set first line as title
    if (titleRef.current) {
      titleRef.current.textContent = firstLine;
      setTitle(firstLine);
      debouncedChange({ title: firstLine });
    }

    // Insert remaining lines into the editor body
    if (restLines && editor) {
      // Convert remaining text to HTML paragraphs
      const htmlContent = restLines
        .split(/\r?\n/)
        .map((line) => (line.trim() ? `<p>${line}</p>` : "<p></p>"))
        .join("");

      // If editor is empty, set content; otherwise insert at start
      const currentContent = editor.getHTML();
      if (!currentContent || currentContent === "<p></p>") {
        editor.commands.setContent(htmlContent);
      } else {
        editor.chain().focus("start").insertContent(htmlContent).run();
      }
    }
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    onChange({ categoryId: id });
    setShowCatPicker(false);
  };

  const activeCat = categories.find((c) => c.id === categoryId);
  const activeCatStyle = activeCat ? getCategoryStyle(activeCat.color) : null;

  return (
    <div className="flex h-full flex-col">
      {/* Top bar: back button (mobile) + category */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 md:px-6 py-2 md:py-3">
        <div className="flex items-center gap-2">
          {/* Mobile back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden rounded-lg p-2 text-gray-400 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Desktop: show all category chips */}
          <div className="hidden md:flex items-center gap-2">
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

          {/* Mobile: compact category picker */}
          <div className="md:hidden relative">
            <button
              onClick={() => setShowCatPicker(!showCatPicker)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium min-h-[36px] flex items-center gap-1 ${
                activeCatStyle
                  ? `${activeCatStyle.bg} ${activeCatStyle.text}`
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {activeCat?.name || "选择分类"}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCatPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCatPicker(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[140px]">
                  {categories.map((c) => {
                    const style = getCategoryStyle(c.color);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleCategoryChange(c.id)}
                        className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 min-h-[44px] ${
                          categoryId === c.id ? "bg-gray-50 font-medium" : "hover:bg-gray-50"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-300 hidden md:inline">自动保存</span>
      </div>

      {/* Format toolbar */}
      {editor && (
        <div className="flex items-center gap-0.5 border-b border-gray-100 px-4 md:px-6 py-1 md:py-2 overflow-x-auto">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="标题 1"
          >
            <span className="font-bold text-xs">H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="标题 2"
          >
            <span className="font-bold text-xs">H2</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="标题 3"
          >
            <span className="font-bold text-xs">H3</span>
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-gray-200 shrink-0" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="加粗"
          >
            <span className="font-bold text-xs">B</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="斜体"
          >
            <span className="italic text-xs">I</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="删除线"
          >
            <span className="line-through text-xs">S</span>
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-gray-200 shrink-0" />

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

          <div className="mx-1 h-4 w-px bg-gray-200 shrink-0" />

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

          <div className="mx-1 h-4 w-px bg-gray-200 shrink-0" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="分割线"
          >
            <span className="text-xs">—</span>
          </ToolbarButton>
        </div>
      )}

      {/* Editor area - title and body in same scrollable container for seamless selection */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4">
        <div
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleTitleInput}
          onKeyDown={handleTitleKeyDown}
          onPaste={handleTitlePaste}
          data-placeholder="输入标题..."
          className="note-title mb-4 w-full text-2xl font-bold text-gray-800 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:pointer-events-none"
          role="textbox"
          aria-label="笔记标题"
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
