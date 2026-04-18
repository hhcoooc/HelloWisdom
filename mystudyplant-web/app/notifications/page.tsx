"use client";

import { useEffect, useState } from "react";
import http from "@/src/lib/http";
import { Bell, BellRing, MessageSquare, CheckCheck, Clock, ThumbsUp, Info, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 定义通知类型
interface NotificationVO {
  id: number;
  senderId: number;
  senderName: string;
  type: number; // 1-点赞, 2-评论, 3-系统
  targetId: number; 
  commentId?: number; // 新增：如果是评论通知，可以带有对应的 commentId 用于跳转定位
  content: string;
  isRead: number; // 0-未读, 1-已读
  createTime: string;
}

const formatTime = (timeStr?: string) => {
  if (!timeStr) return "未知时间";
  try {
    // 兼容可能存在的不同时间格式
    const d = new Date(timeStr.replace("T", " ").replace(/\.\d+/, ""));
    if (isNaN(d.getTime())) return timeStr.split("T")[0];
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "刚刚";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} 天前`;
    
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return timeStr.split("T")[0] || timeStr;
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationVO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const size = 10;

  const fetchNotifications = async (p: number) => {
    setIsLoading(true);
    try {
      const res = await http.get(`/notifications/list?page=${p}&size=${size}`);
      if (res.data?.code === 200) {
        setNotifications(res.data.data?.list || []);
        setTotal(res.data.data?.total || 0);
      }
    } catch (error: any) {
      console.error(error);
      //如果捕获到401状态码，或者错误信息包含未登录，则跳转到登录页
      if (error.response?.status === 401 || error.message.includes('401')) {
      router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const markAllAsRead = async () => {
    try {
      const res = await http.put("/notifications/read");
      if (res.data?.code === 200) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
        // 软刷新页面以便触发顶部导航栏的角标重新获取或消失
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: number | string) => {
    switch (Number(type)) {
      case 1:
        return <ThumbsUp className="w-5 h-5 text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full" />;
      case 2:
        return <MessageSquare className="w-5 h-5 text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full" />;
      case 3:
      default:
        return <Info className="w-5 h-5 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full" />;
    }
  };

const getActionText = (notify: any) => {
      switch (Number(notify.type)) {
        case 1: return "点赞了你的文章";
        case 2: 
          if (notify.content?.startsWith("回复了你的评论")) return "回复了你的评论";
          if (notify.content?.startsWith("在你的文章中回复了")) return "回复了评论";
          return "评论了你的文章";
      case 3: return "系统通知";
      default: return "与你互动";
    }
  };

  const totalPages = Math.ceil(total / size);
  const allRead = notifications.every(n => Number(n.isRead) === 1);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-24 pb-12 transition-colors duration-500">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/10 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-100/50 to-white dark:from-zinc-800/10 dark:to-zinc-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-md">
               <BellRing className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">通知中心</h1>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">你的所有互动提醒</p>
             </div>
          </div>
          
          <button 
            onClick={markAllAsRead}
            disabled={allRead || notifications.length === 0}
            className="relative z-10 flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <CheckCheck className={`w-4 h-4 ${!allRead ? 'text-zinc-900 dark:text-white' : ''}`} />
            一键已读
          </button>
        </div>

        {/* List Body */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm min-h-[400px]">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64">
               <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-800 dark:border-t-zinc-200 rounded-full animate-spin"></div>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4 animate-pulse">正在加载通知...</p>
             </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400 dark:text-zinc-600 space-y-4">
              <Bell className="w-16 h-16 stroke-1 opacity-50" />
              <p className="text-sm">暂无任何通知</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notify) => (
                <div 
                  key={notify.id} 
                  className={`group relative flex gap-4 p-4 rounded-xl transition-all ${
                    Number(notify.isRead) === 0
                      ? 'border-l-4 border-l-zinc-900 dark:border-l-white bg-zinc-50/50 dark:bg-zinc-800/30 border border-y-black/5 border-r-black/5 dark:border-y-white/5 dark:border-r-white/5 shadow-sm'
                      : 'border border-transparent hover:border-zinc-100 hover:bg-zinc-50/50 dark:hover:border-zinc-800/50 dark:hover:bg-zinc-800/30'
                  }`}
                >
                  {/* Icon Column */}
                  <div className="pl-1 pt-1 flex-shrink-0">
                    {getIcon(notify.type)}
                  </div>

                  {/* Details Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                      <div className="text-sm">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-2">
                          {notify.senderName || "平台用户"}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {getActionText(notify)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {formatTime(notify.createTime)}
                      </span>
                    </div>

                    {notify.content && Number(notify.type) === 2 && (
                      <div className="mt-2 p-3 text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 shadow-sm rounded-lg border border-zinc-100 dark:border-white/5 inline-block w-full sm:w-11/12 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-zinc-400 dark:text-zinc-500 mr-2">“</span>
                        {notify.content.replace(/^回复了你的评论\s*:\s*/, '').replace(/^在你的文章中回复了\s*@.*?\s*:\s*/, '').replace(/^评论了你的文章\s*:\s*/, '')}
                        <span className="text-zinc-400 dark:text-zinc-500 ml-2">”</span>
                      </div>
                    )}

                    {notify.targetId && Number(notify.type) !== 3 && (
                      <div className="mt-3">
                        <Link
                          href={`/article/${notify.targetId}${notify.commentId ? `?commentId=${notify.commentId}` : ''}`}
                          className="inline-flex items-center text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 hover:underline transition-colors gap-1 shadow-sm"
                        >
                          查看详情
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
             <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
               <button
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
               >
                 <ChevronLeft className="w-5 h-5" />
               </button>
               <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                 {page} / {totalPages}
               </span>
               <button
                 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                 disabled={page === totalPages}
                 className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
               >
                 <ChevronRight className="w-5 h-5" />
               </button>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
