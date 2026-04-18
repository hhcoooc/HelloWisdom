"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import http from "@/src/lib/http";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultListRef = useRef<HTMLDivElement>(null);

  // 每次打开弹窗时清空输入并聚焦
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(-1);
      // 等待弹窗渲染完毕后聚焦
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 获取并防抖延迟发送请求
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await http.get(`/article/search?keyword=${encodeURIComponent(query)}`);
        if (res.data?.code === 200) {
          setResults(res.data.data || []);
          setSelectedIndex(-1);
      }
          } catch (error) {
        console.error("搜索请求失败:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms 的防抖

    return () => clearTimeout(timer);
  }, [query]);

  // 快捷键处理（上下方向键与回车、ESC）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          router.push(`/article/${results[selectedIndex].id}`);
          onClose();
        } else if (results.length > 0) {
          // 如果没有特殊的选中项目，默认回车选中第一个
          router.push(`/article/${results[0].id}`);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex, router]);

  // 滚动选中项到可视区域内
  useEffect(() => {
    if (selectedIndex >= 0 && resultListRef.current) {
      const activeEl = resultListRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // 高亮匹配内容
  const highlightMatch = (text: string, keyword: string, isContent = false) => {
    if (!text || !keyword) return text;
    
    let cleanText = text.replace(/<[^>]+>/g, '').replace(/!\[.*?\]\([^\)]*\)?/g, '');
    const lowerText = cleanText.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerKeyword);
    
    if (isContent && matchIndex > -1) {
      // 截取匹配点前后一定长度文本
      const start = Math.max(0, matchIndex - 30);
      const end = Math.min(cleanText.length, matchIndex + keyword.length + 30);
      cleanText = (start > 0 ? "..." : "") + cleanText.substring(start, end) + (end < cleanText.length ? "..." : "");
    }

    // 利用正则区分大小写进行高亮替换
    const regex = new RegExp(`(${keyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    const parts = cleanText.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) 
      ? <mark key={i} className="bg-blue-400/30 text-blue-600 dark:text-blue-400 font-semibold rounded-[2px] px-0.5 underline decoration-blue-400/30 underline-offset-2 bg-transparent">{part}</mark> 
      : part
    );
  };

  // 如果没有打开，不渲染组件
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 sm:pt-32 px-4 animate-in fade-in duration-200">
      {/* 模糊背景遮罩 */}
      <div 
        className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* 搜索框主体 */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#11141a] rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        
        {/* 输入区 */}
        <div className="flex items-center px-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="w-6 h-6 text-zinc-500 dark:text-white mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (selectedIndex !== -1) setSelectedIndex(-1);
            }}
            placeholder="搜索文章标题或内容..."
            className="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-lg sm:text-xl font-medium"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-zinc-400 animate-spin mx-3 shrink-0" />}
          <button 
            onClick={onClose}
            className="p-1.5 ml-2 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 结果区 */}
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {!query.trim() ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <Search className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mb-4" />
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                输入关键字开始在全站知识库中探索
              </p>
            </div>
          ) : results.length > 0 ? (
                        <div className="space-y-1" ref={resultListRef}>
              {results.map((item, index) => {
                const isActive = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => {
                      router.push(`/article/${item.id}`);
                      onClose();
                    }}
                    className={`flex flex-col p-3 sm:px-4 sm:py-3 rounded-xl cursor-pointer transition-colors group ${isActive ? "bg-zinc-100 dark:bg-zinc-800/80 ring-1 ring-zinc-200 dark:ring-zinc-700" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}  
                  >
                    <h4 className={`font-medium flex items-center text-base ${isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-blue-400"}`}>
                      <FileText className={`w-4 h-4 mr-3 shrink-0 ${isActive ? "text-blue-500 dark:text-blue-400" : "text-zinc-400 group-hover:text-blue-400"}`} />
                      <span className="truncate">{highlightMatch(item.title, query, false)}</span>
                    </h4>
                    {item.content && (
                      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 ml-7 leading-relaxed">
                        {highlightMatch(item.content, query, true)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : !isLoading ? (
            <div className="py-16 text-center text-zinc-500 dark:text-zinc-400 text-sm">
              没有找到匹配 "{query}" 的文章，换个搜索词试试？
            </div>
          ) : null}
        </div>
        
        {/* 底部提示 */}
        <div className="hidden sm:flex items-center justify-between px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center"><kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm mr-1.5 font-sans">↵</kbd> 跳转详情</span>
            <span className="flex items-center"><kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm mr-1.5 font-sans">ESC</kbd> 取消退出</span>
          </div>
          <div className="flex items-center">
            由 Elasticsearch 提供检索支持 ⚡️
          </div>
        </div>
      </div>
    </div>
  );
}