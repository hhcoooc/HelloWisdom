"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Send, Save, Check } from "lucide-react";
import Link from "next/link";
import http from "@/src/lib/http";
import { MarkdownEditor } from "../../components/md-editor";

function PublishForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = searchParams.get('id');

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(!!articleId);
  const [errorMsg, setErrorMsg] = useState("");

  const LOCAL_DRAFT_KEY = `article_draft_${articleId || 'new'}`;

  // 恢复本地草稿
  useEffect(() => {
    if (!articleId) {
      const localDraft = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft);
          if ((parsed.title || parsed.content) && window.confirm('发现本地有未发布的草稿，是否恢复？')) {
            setTitle(parsed.title || '');
            setContent(parsed.content || '');
            if (parsed.categoryId) setCategoryId(parsed.categoryId);
          } else {
            localStorage.removeItem(LOCAL_DRAFT_KEY);
          }
        } catch (e) {}
      }
    }
  }, [articleId, LOCAL_DRAFT_KEY]);

  // 定时保存本地草稿 (每10秒)
  useEffect(() => {
    const timer = setInterval(() => {
      if (title || content) {
        localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({ title, content, categoryId }));
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [title, content, categoryId, LOCAL_DRAFT_KEY]);

  const handleSaveDraft = async () => {
    if (!title.trim() && !content.trim()) {
      setErrorMsg("不能保存空草稿");
      return;
    }
    
    try {
      setIsSavingDraft(true);
      setErrorMsg("");

      const match = content.match(/!\[.*?\]\((.*?)\)/);
      const imageUrl = match ? match[1] : null;

      // 后端需要实现 POST /article/draft 接口
      const res = await http.post("/article/draft", {
        id: articleId ? Number(articleId) : undefined,
        imageUrl,
        title,
        content,
        categoryId
      });

      if (res.data?.code === 200 || res.data?.message === 'success') {
        setDraftSavedAt(new Date());
        localStorage.removeItem(LOCAL_DRAFT_KEY); // 服务端保存成功，清除本地防丢草稿
        
        // 如果是首次创建草稿，后端返回了新草稿的 ID，我们静默把它塞进 URL 避免重复创建
        const newDraftId = res.data.data?.id || (typeof res.data.data === 'number' ? res.data.data : null);
        if (!articleId && newDraftId) {
          router.replace(`/publish?id=${newDraftId}`);
        }
      } else {
        setErrorMsg(res.data?.message || "云端保存草稿失败");
      }
    } catch (error: any) {
      console.error("Save draft error:", error);
      setErrorMsg(error.response?.data?.message || error.response?.data?.msg || error.message || "请求失败");
    } finally {
      setIsSavingDraft(false);
    }
  };

  useEffect(() => {
    if (articleId) {
      http.get(`/article/${articleId}`)
        .then(res => {
          const data = res.data?.data;
          if (data) {
            setTitle(data.title);
            setContent(data.content);
            if (data.categoryId) setCategoryId(data.categoryId);
          }
        })
        .catch(err => {
          setErrorMsg("加载文章失败");
          console.error(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg("请输入文章标题");
      return;
    }

    if (!content.trim()) {
      setErrorMsg("请输入文章内容");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const match = content.match(/!\[.*?\]\((.*?)\)/);
      const imageUrl = match ? match[1] : null;

      let res;
      if (articleId) {
        res = await http.post("/article/update", {
          id: Number(articleId),
          imageUrl,
          title,
          content,
          categoryId
        });
      } else {
        res = await http.post("/article/publish", {
          imageUrl,
          title,
          content,
          categoryId
        });
      }

      if (res.data) {
        localStorage.removeItem(LOCAL_DRAFT_KEY); // 发布成功，清空本地草稿
        router.push("/blog");
        router.refresh();
      }
    } catch (error: any) {
      console.error("Publish error:", error);
     setErrorMsg(error.response?.data?.message || error.response?.data?.msg || error.message || (articleId ? "修改失败" : "发布失败"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-black/50 pt-24 pb-12">   
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-8">
          <Link
            href="/blog"
            className="group flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            返回列表
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">   
            {articleId ? "编辑文章" : "创作新文章"}
          </h1>
          <div className="w-20"></div>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col min-h-[700px]">
          {isLoading ? (
             <div className="flex-1 flex justify-center items-center">
                 <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">       

              <div className="p-6 sm:p-8 pb-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="文章标题"
                  className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 border-none outline-none focus:outline-none focus:ring-0 p-0"
                  autoFocus
                />
              </div>

              <div className="h-px w-full bg-zinc-100 dark:bg-white/5"></div>     

              <div className="flex-1 min-h-[500px] relative">
                <MarkdownEditor value={content} onChange={setContent} height={600} />
              </div>

              {errorMsg && (
                <div className="mx-6 sm:mx-8 mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/50"> 
                  {errorMsg}
                </div>
              )}

              <div className="p-6 sm:p-8 pt-4 flex items-center justify-end border-t border-zinc-100 dark:border-white/5 bg-zinc-50/30 dark:bg-black/10 mt-auto gap-4"> 
                {draftSavedAt && (
                  <span className="text-xs text-green-600 dark:text-green-500 mr-auto flex items-center gap-1.5 transition-all">
                    <Check className="w-3.5 h-3.5" />
                    云端草稿已保存于 {draftSavedAt.toLocaleTimeString()}
                  </span>
                )}
                
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || isSavingDraft}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSavingDraft ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      保存草稿到云端
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isSavingDraft}
                  className="flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {articleId ? "更新中..." : "发布中..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {articleId ? "更新文章" : "发布文章"}
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}

export default function PublishPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>}>
      <PublishForm />
    </Suspense>
  )
}
