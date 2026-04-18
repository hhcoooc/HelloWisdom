"use client";
import { AuthModal } from "../../../components/auth-modal";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Clock, Flame, ArrowLeft, ThumbsUp, Star, MessageSquare, Send, X, Trash2, CornerDownRight } from "lucide-react";
import http from "@/src/lib/http";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedCommentId = searchParams.get("commentId");
  
  const id = params.id as string;

  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, message: '' });
  const requireAuth = (message: string) => setAuthModalConfig({ isOpen: true, message });

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [collectCount, setCollectCount] = useState(0);
  const [collected, setCollected] = useState(false);

  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null); // 保留原来底层的逻辑用于长评回复（可选）
  const [isPublishing, setIsPublishing] = useState(false);

  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [inlineCommentInput, setInlineCommentInput] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (comments.length > 0 && highlightedCommentId) {
      setTimeout(() => {
        const el = document.getElementById(`comment-${highlightedCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [comments, highlightedCommentId]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("studytoken");
      if (token) {
        try {
          const res = await http.get("/users/info");
          setCurrentUser(res.data?.data);
        } catch (e) {
          // Token invalid or not logged in
        }
      }
    };

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const res = await http.get(`/article/${id}`);
        const detail = res.data?.data || null;
        if (detail) {
          setArticle(detail);
          setLikeCount(detail.likeCount || 0);
          setLiked(!!detail.liked);
          setCollectCount(detail.collectCount || 0);
          setCollected(!!detail.collected);
        } else {
          setErrorMsg("文章未找到或已被删除");
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.response?.data?.msg || err.response?.data?.message || err.message || "获取文章详情失败");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const res = await http.get(`/comments/${id}/comments`);
        setComments(res.data?.data || []);
      } catch (err) {
        console.error("加载评论失败", err);
      }
    };

    if (id) {
      fetchUser();
      fetchDetail();
      fetchComments();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇文章吗？此操作无法恢复。")) return;
    try {
      setIsDeleting(true);
      await http.delete(`/article/delete/${id}`);
      alert("删除成功！");
      router.push("/blog");
    } catch (err: any) {
      alert(err.response?.data?.msg || err.response?.data?.message || err.message || "删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    try {
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
      await http.post(`/article/like/${id}`);
    } catch (err: any) {
      setLiked(liked);
      setLikeCount(likeCount);
      if (err.response?.status === 401) {
        requireAuth("登录后即可点赞和支持作者");
      } else {
        alert("操作失败！");
      }
    }
  };

  const handleFavorite = async () => {
    try {
      setCollected(!collected);
      setCollectCount(prev => collected ? prev - 1 : prev + 1);
      await http.post(`/api/favorites/${id}/toggle`);
    } catch (err: any) {
      setCollected(collected);
      setCollectCount(collectCount);
      if (err.response?.status === 401) {
        requireAuth("登录后即可收藏高质量文章");
      } else {
        alert("操作失败！");
      }
    }
  };

  const handlePublishComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      setIsPublishing(true);
      const payload: any = {
        articleId: Number(id),
        content: commentInput,
      };
      if (replyingTo) {
        payload.parentId = replyingTo.id;
        payload.targetUserName = replyingTo.authorName; // 用于给后端发送通知
      }

      await http.post("/comments/publish", payload);
      
      setCommentInput("");
      setReplyingTo(null);
      const res = await http.get(`/comments/${id}/comments`);
      setComments(res.data?.data || []);
      
    } catch (err: any) {
      if (err.response?.status === 401) {
        requireAuth("登录后即可参与评论互动");
      } else {
        alert(err.response?.data?.msg || err.response?.data?.message || err.message || "评论发布失败，请重试");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleInlinePublish = async (e: FormEvent, parentId: number, targetUserName: string) => {
    e.preventDefault();
    if (!inlineCommentInput.trim()) return;

    try {
      setIsPublishing(true);
      const payload: any = {
        articleId: Number(id),
        parentId: parentId, // 楼中楼关联的顶层评论 ID 或父评论 ID
        targetUserName: targetUserName, // 被回复人
        content: inlineCommentInput,
      };

      await http.post("/comments/publish", payload);

      setInlineCommentInput("");
      setReplyingToId(null);
      const res = await http.get(`/comments/${id}/comments`);
      setComments(res.data?.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        requireAuth("登录后即可参与评论互动");
      } else {
        alert(err.response?.data?.msg || err.response?.data?.message || err.message || "评论发布失败，请重试");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black py-16 sm:py-24 transition-colors duration-500">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/10 rounded-2xl sm:rounded-[32px] p-6 sm:p-12 md:p-14 shadow-sm relative overflow-hidden animate-pulse">
            
            {/* Header Skeleton */}
            <header className="mb-10 sm:mb-14 relative z-10 flex flex-col items-center">
              <div className="h-6 sm:h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-6 relative overflow-hidden">
                 <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent border-t border-white/20"></div>
              </div>
              <div className="h-8 sm:h-12 md:h-14 w-11/12 sm:w-4/5 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-4 relative overflow-hidden">
                 <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent"></div>
              </div>
              <div className="h-8 sm:h-12 md:h-14 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-6 relative overflow-hidden">
                 <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent"></div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-4 pt-6 mt-6 border-t border-zinc-100 dark:border-white/5 w-full">
                <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
                <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
                <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
              </div>
            </header>

            {/* Content Skeleton */}
            <div className="space-y-4">
               {[1, 2, 3, 4, 5, 6].map((i) => (
                 <div key={i} className={`h-4 bg-zinc-200 dark:bg-zinc-800 rounded relative overflow-hidden ${i % 3 === 0 ? 'w-4/5' : i % 2 === 0 ? 'w-11/12' : 'w-full'}`}>
                   <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent"></div>
                 </div>
               ))}
               <div className="h-4 bg-transparent my-4"></div>
               <div className="h-32 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl relative overflow-hidden mt-4">
                 <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent"></div>
               </div>
               <div className="h-4 bg-transparent my-4"></div>
               {[1, 2, 3, 4].map((i) => (
                 <div key={`p2-${i}`} className={`h-4 bg-zinc-200 dark:bg-zinc-800 rounded relative overflow-hidden ${i === 4 ? 'w-2/3' : 'w-full'}`}>
                   <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent"></div>
                 </div>
               ))}
            </div>

          </div>
        </article>
      </div>
    );
  }

  if (errorMsg || !article) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-32 flex flex-col items-center gap-4 min-h-screen">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">出错了</h2>
        <p className="text-zinc-500">{errorMsg}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
        >
          返回上一页
        </button>
      </div>
    );
  }

const renderComments = (commentList: any[], depth = 0) => {
    return commentList.map(comment => {
      const isHighlighted = Number(highlightedCommentId) === comment.id;
      return (
      <div 
        key={comment.id} 
        id={`comment-${comment.id}`}
        className={`mt-4 first:mt-0 p-4 rounded-xl transition-all duration-1000 ${
          isHighlighted
            ? "bg-zinc-200/50 dark:bg-zinc-700/80 ring-2 ring-zinc-900 dark:ring-zinc-400"
            : depth === 0 
              ? "bg-zinc-50 dark:bg-zinc-800/50" 
              : "bg-transparent border-t border-zinc-100 dark:border-zinc-800/50 pt-4"
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {comment.authorName || "匿名用户"}
            </span>
            <span className="text-xs text-zinc-500">
              {new Date(comment.createTime).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="text-zinc-700 dark:text-zinc-300 text-sm ml-11 mb-2 leading-relaxed">
          {comment.targetUserName && (
            <span className="text-zinc-900 dark:text-zinc-100 font-medium mr-2 px-1.5 py-0.5 bg-zinc-200/50 dark:bg-zinc-700/50 rounded">
              @{comment.targetUserName}
            </span>
          )}
          {comment.content}
        </div>

        <div className="ml-11">
          <button
            onClick={() => {
              setReplyingToId(replyingToId === comment.id ? null : comment.id);
              setInlineCommentInput('');
            }}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <CornerDownRight className="w-3 h-3" />
            回复
          </button>
        </div>

        {replyingToId === comment.id && (
          <div className="ml-11 mt-3 mb-4 animate-in fade-in duration-200">
            <form 
              onSubmit={(e) => handleInlinePublish(e, comment.parentId || comment.id, comment.authorName)}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                autoFocus
                type="text"
                placeholder={`回复 @${comment.authorName}...`}
                value={inlineCommentInput}
                onChange={(e) => setInlineCommentInput(e.target.value)}
                className="flex-1 bg-white dark:bg-[#11141a] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition text-zinc-900 dark:text-white"
              />
              <div className="flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setReplyingToId(null)}
                  className="px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!inlineCommentInput.trim() || isPublishing}
                  className="flex items-center justify-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  {isPublishing ? "发送..." : "发送"}
                </button>
              </div>
            </form>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-11 mt-3 border-l-2 border-zinc-200/50 dark:border-zinc-700/50 pl-4 space-y-1">
            {renderComments(comment.replies, depth + 1)}
          </div>
        )}
      </div>
      );
    });
  };

  const canDelete = currentUser && article && (currentUser.id === article.authorId || currentUser.username === 'admin');

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </Link>
        {canDelete && (
          <div className="flex items-center gap-4">
            <Link
              href={`/publish?id=${id}`}
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
            >
              编辑文章
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "删除中..." : "删除文章"}
            </button>
          </div>
        )}
      </div>

      <article>
        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            {article.authorName && (
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {article.authorName}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{article.createTime ? new Date(article.createTime).toLocaleDateString() : "未知时间"}</span>
            </div>
            {article.viewCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                <span>{article.viewCount} 阅读</span>
              </div>
            )}
          </div>
        </header>

        <div className="prose prose-zinc dark:prose-invert max-w-none w-full mb-12">
          {article.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          ) : (
            <p className="text-zinc-500 italic">这篇文章没有内容。</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 py-8 border-y border-zinc-200 dark:border-zinc-800 mb-12">
          <button 
            onClick={handleLike}
            className={`flex flex-col items-center gap-2 transition-colors ${liked ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            <div className={`p-4 rounded-full ${liked ? "bg-zinc-200 dark:bg-zinc-700/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
              <ThumbsUp className={`w-6 h-6 ${liked ? "fill-current" : ""}`} />
            </div>
            <span className="text-sm font-medium">{likeCount} 赞</span>
          </button>

          <button 
            onClick={handleFavorite}
            className={`flex flex-col items-center gap-2 transition-colors ${collected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-100"}`}
          >
            <div className={`p-4 rounded-full ${collected ? "bg-zinc-200 dark:bg-zinc-700/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
              <Star className={`w-6 h-6 ${collected ? "fill-current" : ""}`} />
            </div>
            <span className="text-sm font-medium">{collectCount} 收藏</span>
          </button>
        </div>

        <section id="comments">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            评论区
          </h3>

          <form onSubmit={handlePublishComment} className="mb-10 bg-white dark:bg-[#11141a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {replyingTo && (
              <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2 rounded-lg mb-3">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  回复 <span className="text-zinc-900 dark:text-zinc-100 font-medium">@{replyingTo.authorName}</span> :
                </span>
                <button 
                  type="button" 
                  onClick={() => setReplyingTo(null)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <textarea
              rows={3}
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="分享你的见解吧..."
              className="w-full bg-transparent resize-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
            <div className="flex justify-end mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="submit"
                disabled={isPublishing || !commentInput.trim()}
                className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isPublishing ? "发布中..." : "发布评论"}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            {comments.length > 0 ? (
              renderComments(comments)
            ) : (
              <div className="text-center py-10 text-zinc-500">
                暂无评论，快来抢沙发吧！
              </div>
            )}
          </div>
        </section>
      </article>
      <AuthModal isOpen={authModalConfig.isOpen} onClose={() => setAuthModalConfig({ ...authModalConfig, isOpen: false })} message={authModalConfig.message} />
    </div>
  );
}