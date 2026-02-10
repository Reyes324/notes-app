"use client";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";

export default function CodeBlockView() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const codeEl = document.querySelector(".ProseMirror pre.active-code-block code");
    if (!codeEl) return;
    try {
      await navigator.clipboard.writeText(codeEl.textContent || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <NodeViewWrapper
      className="active-code-block-wrapper relative group"
      onMouseEnter={(e: React.MouseEvent) => {
        const pre = e.currentTarget.querySelector("pre");
        pre?.classList.add("active-code-block");
      }}
      onMouseLeave={(e: React.MouseEvent) => {
        const pre = e.currentTarget.querySelector("pre");
        pre?.classList.remove("active-code-block");
      }}
    >
      <pre className="relative">
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded-md bg-white/10 px-2 py-1 text-xs text-gray-300 opacity-0 transition-all hover:bg-white/20 hover:text-white group-hover:opacity-100"
          contentEditable={false}
        >
          {copied ? "已复制 ✓" : "复制"}
        </button>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
