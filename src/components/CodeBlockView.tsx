"use client";

import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { useState, useRef } from "react";

export default function CodeBlockView() {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    const text = preRef.current?.textContent || "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <NodeViewWrapper className="relative group">
      <pre ref={preRef} className="relative">
        <button
          type="button"
          onClick={handleCopy}
          className="absolute right-2 top-2 rounded-md bg-white/10 px-2 py-1 text-xs text-gray-300 opacity-0 transition-all hover:bg-white/20 hover:text-white group-hover:opacity-100"
          contentEditable={false}
        >
          {copied ? "已复制 ✓" : "复制"}
        </button>
        <NodeViewContent />
      </pre>
    </NodeViewWrapper>
  );
}
