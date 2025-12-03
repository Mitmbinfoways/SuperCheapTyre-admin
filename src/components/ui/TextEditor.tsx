"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiHash,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
} from "react-icons/fi";
import { useEffect } from "react";

export default function TextEditor({ value = "", className = "", onChange = (content: string) => { } }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: { class: "list-disc ml-5" },
        },
        orderedList: {
          HTMLAttributes: { class: "list-decimal ml-5" },
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Add this effect to update the editor content when the value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) return null;

  // Custom list handling implementation
  const toggleBulletList = () => {
    // Custom implementation to ensure visible and maintainable bullet lists
    editor.chain().focus().toggleBulletList().run();
  };

  const toggleOrderedList = () => {
    // Custom implementation to ensure visible and maintainable numbered lists
    editor.chain().focus().toggleOrderedList().run();
  };

  // Helper functions to check active alignment
  const isTextAlignActive = (alignment: string) => {
    return editor.isActive({ textAlign: alignment });
  };

  return (
    <div className="border rounded">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded ${editor.isActive("bold") ? "bg-gray-200" : ""}`}
          title="Bold"
        >
          <FiBold />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded ${editor.isActive("italic") ? "bg-gray-200" : ""}`}
          title="Italic"
        >
          <FiItalic />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded ${editor.isActive("underline") ? "bg-gray-200" : ""}`}
          title="Underline"
        >
          <FiUnderline />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={toggleBulletList}
          className={`p-2 rounded ${editor.isActive("bulletList") ? "bg-gray-200" : ""}`}
          title="Bullet List"
        >
          <FiList />
        </button>
        <button
          type="button"
          onClick={toggleOrderedList}
          className={`p-2 rounded ${editor.isActive("orderedList") ? "bg-gray-200" : ""}`}
          title="Ordered List"
        >
          {/* Using FiHash as a semantically appropriate alternative for ordered list */}
          <FiHash />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded ${isTextAlignActive('left') ? "bg-gray-200" : ""}`}
          title="Align Left"
        >
          <FiAlignLeft />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded ${isTextAlignActive('center') ? "bg-gray-200" : ""}`}
          title="Align Center"
        >
          <FiAlignCenter />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded ${isTextAlignActive('right') ? "bg-gray-200" : ""}`}
          title="Align Right"
        >
          <FiAlignRight />
        </button>
      </div>
      <EditorContent editor={editor} className={`p-3 min-h-32 prose-editor ${className}`} />
    </div>
  );
}