"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Clock, Flame, Loader2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import http from "@/src/lib/http";

export default function BlogPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const getSummaryText = (article: any) => {
    let text = article.summary || article.content || '';
    if (typeof text !== 'string') return '这是一篇精彩的文章，暂无摘要。';

    let clean = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
                    .replace(/!\[[^\]]*\]\([^)]*$/, '')
                    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
                    .replace(/\[([^\]]*)\]\([^)]*$/, '$1');

    clean = clean.replace(/<[^>]*>?/gm, '');
    clean = clean.replace(/[#*>`]/g, '').replace(/\s+/g, ' ').trim();

    return clean.substring(0, 100) || '这是一篇精彩的文章，暂无摘要。';
  };

  const getFirstImage = (content: any) => {
    if (!content) return null;
    const match = content.match(/!\[.*?\]\((.*?)\)/);
    return match ? match[1] : null;
  };

  // 用于无限滚动的观察者引用
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);

  const fetchArticles = useCallback(async (currentCursor: number | null) => {
    if (isLoading) return;
    try {
      setIsLoading(true);

      const currentSize = isFirstLoadRef.current ? 10 : 2;

      const feedParams: any = { size: currentSize };
      const listParams: any = { pageSize: currentSize };
      if (currentCursor) {
        feedParams.cursor = currentCursor;
        listParams.cursorId = currentCursor;
      }

      const [feedRes, listRes] = await Promise.all([
        http.get("/article/feed", { params: feedParams }),
        http.get("/article/list", { params: listParams })
      ]);

      const feedData = feedRes.data?.data || [];
      const listData = listRes.data?.data?.data || [];

      let newArticles = Array.isArray(feedData) ? feedData : [];

      newArticles = newArticles.map((a: any) => {
        const matchingListArticle = Array.isArray(listData)
          ? listData.find((la: any) => la.id === a.id)
          : null;
        return {
          ...a,
          authorName: matchingListArticle?.authorName || "佚名",
          _loopKey: `${a.id}-${Math.random()}-${Date.now()}`
        };
      });

      let nextCursorValue = feedRes.data?.data?.nextCursor ?? feedRes.data?.nextCursor;

      if (nextCursorValue === undefined && newArticles.length > 0) {
        nextCursorValue = newArticles[newArticles.length - 1].id;
      } else if (nextCursorValue === undefined) {
        nextCursorValue = null;
      }

      // 如果当前没有拿到新数据（到了尾页并且后端没给出任何补全数据），就直接重置游标到头部
      if (!newArticles || newArticles.length === 0) {
        setCursor(null);
        isFirstLoadRef.current = false;
        return;
      }

      setArticles(prev => {
        // 合并数据并限制在最近的10篇文章，实现滑动窗口效果
        const combined = [...prev, ...newArticles];
        return combined.slice(-10);
      });
      isFirstLoadRef.current = false;

      // 如果返回的下一个 cursor 为 null，说明到头了，那么重置游标指向空，实现“无限轮播”
      if (nextCursorValue === null) {
        setCursor(null);
      } else {
        setCursor(nextCursorValue);
      }
    } catch (error) {
      console.error("Failed to load articles:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // 初始化加载
  useEffect(() => {
    fetchArticles(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听底部元素可见性，触发加载更多
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchArticles(cursor);
        }
      },
      { 
        rootMargin: "300px", 
        threshold: 0.1 
      }
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [observerTarget, hasMore, isLoading, cursor, fetchArticles]);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 min-h-screen">
      
      {/*...*/}
      <div className="mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">文章归档</h1>
          <p className="text-zinc-500 dark:text-zinc-400">记录思考、沉淀知识与技术分享。</p>
        </div>
        <div className="flex gap-2 items-center">
          {["架构", "后端", "产品"].map(tag => (
            <span key={tag} className="px-3 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 rounded-full cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/*...*/}
      {/* Empty skeleton loader */}
      {articles.length === 0 && isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skel-${i}`} className="flex flex-col bg-white dark:bg-[#11141a] rounded-3xl border border-zinc-200 dark:border-zinc-800/50 overflow-hidden shadow-sm animate-pulse min-h-[360px]">
              <div className="h-48 bg-zinc-200 dark:bg-zinc-800 relative w-full overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent"></div>
              </div>
              <div className="p-6 flex flex-col flex-1 gap-4">
                <div className="flex gap-2">
                   <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                   <div className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                </div>
                <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 rounded mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
          {articles.map((article: any, index: number) => (
            <article 
              key={article._loopKey || article.id || index} 
              className="group relative flex flex-col bg-white dark:bg-[#11141a] rounded-3xl border border-zinc-200 dark:border-zinc-800/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <Link href={`/article/${article.id}`} className="absolute inset-0 z-10" aria-label="查看文章" />
              
              {/*...*/}
              {(article.imageUrl || getFirstImage(article.content)) && (
                <div className="w-full h-48 sm:h-56 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <img 
                    src={article.imageUrl || getFirstImage(article.content)} 
                    alt={article.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              {/*...*/}
              <div className="flex-1 p-6 sm:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-2.5 py-1 rounded-md">
                    {/*...*/}
                    {article.categoryName || "随笔"}
                  </span>
                  
                  {article.hot && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      HOT
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3 line-clamp-2 group-hover:text-zinc-900 dark:group-hover:text-blue-400 transition-colors">
                  {article.title}
                </h2>
                
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 line-clamp-3 leading-relaxed">
                  {getSummaryText(article)}
                </p>

                <div className="mt-auto flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500 font-medium">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(article.createTime || Date.now()).toLocaleDateString('zh-CN')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span>{article.authorName || "佚名"}</span>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-400 dark:text-zinc-600">
            <p className="text-lg mb-4">这里是一片荒芜...</p>
            <p className="text-sm">尝试发布第一篇文章吧</p>
          </div>
        )
      )}

      {/*...*/}
      <div 
        ref={observerTarget} 
        className="w-full h-24 flex items-center justify-center mt-12"
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">加载中...</span>
          </div>
        )}
        {!isLoading && !hasMore && articles.length > 0 && (
          <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-600">
            <div className="h-px w-12 bg-zinc-200 dark:bg-zinc-800"></div>
            <span className="text-sm font-medium">已经到底啦</span>
            <div className="h-px w-12 bg-zinc-200 dark:bg-zinc-800"></div>
          </div>
        )}
      </div>

    </div>
  );
}
