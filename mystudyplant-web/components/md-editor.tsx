"use client";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import { useRef, useMemo } from "react";
import http from "@/src/lib/http";
import { commands } from "@uiw/react-md-editor";

const MDEditor = dynamic(() => import("@uiw/react-md-editor").then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-zinc-500">加载编辑器中...</div>
});

interface MDEditorProps {
  value: string;
  onChange: (val: string) => void;
  height?: number;
}

export function MarkdownEditor({ value, onChange, height = 500 }: MDEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "ARTICLE_IMAGE");

      const res = await http.post("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      return res.data?.url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await handleImageUpload(file);
      if (url) {
        onChange(value + `\n![图片](${url})\n`);
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const customCommands = useMemo(() => {
    // Modify the default image command
    const customImage = {
      ...commands.image,
      execute: () => {
        // Instead of inserting text, open the file picker
        fileInputRef.current?.click();
      }
    };
    
    // Replace the default image command in the toolbar
    return commands.getCommands().map(cmd => {
      if (cmd.name === 'image') return customImage;
      return cmd;
    });
  }, [fileInputRef, value, onChange]);

  return (
    <div data-color-mode="light" className="h-full w-full overflow-hidden relative">
      {/* Hidden file input triggered by the custom toolbar icon */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={height}
        commands={customCommands}
        className="w-full h-full border-none shadow-none rounded-none !bg-transparent"
        textareaProps={{
          placeholder: "开始书写你的故事... (可以直接拖拽图片到这里，或者粘贴图片)",
        }}
        preview="live" // split screen
        hideToolbar={false} // show toolbar
        onDrop={async (event) => {
            event.preventDefault();
            const files = event.dataTransfer.files;
            if (files && files.length > 0) {
              const file = files[0];
              if (file.type.startsWith("image/")) {
                const url = await handleImageUpload(file);
                if (url) {
                    onChange(value + `\n![图片](${url})\n`);
                }
              }
            }
        }}
        onPaste={async (event) => {
            const items = event.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    event.preventDefault();
                    const file = items[i].getAsFile();
                    if(file) {
                        const url = await handleImageUpload(file);
                        if (url) {
                            onChange(value + `\n![图片](${url})\n`);
                        }
                    }
                }
            }
        }}
      />
    </div>
  );
}