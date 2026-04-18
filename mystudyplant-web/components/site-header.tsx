"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { LogOut, User, PenSquare, LogIn, UserPlus, Search, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import http from "@/src/lib/http";
import { SearchModal } from "./search-modal";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  
  // 要隐藏导航栏主体的路由
  const hideNavRoutes = ["/login", "/register", "/publish", "/"];
  const isLoginRoute = pathname === "/login" || pathname === "/register";
  const showNav = !hideNavRoutes.includes(pathname ?? "");

  const [isMounted, setIsMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Todo: 后续可以通过接口获取真实的头像 URL，若无则使用 null 从而显示默认 <User>
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // WebSocket 实时弹窗状态
  const [toast, setToast] = useState<{ id: number, content: string, senderName: string, isVisible: boolean } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    // 每次路过路由时验证 token 有效性，防止后端重启导致伪登录状态
    const token = localStorage.getItem("studytoken");
    if (token) {
      // 先乐观假设已登录，避免页面闪烁
      setIsLoggedIn(true);
      // 静默校验 token
      http.get("/users/info")
        .then(res => {
          if (res.data?.data?.avatar) {
            setAvatarUrl(res.data.data.avatar);
          }
          http.get("/notifications/unread").then(notifyRes => {
            if (notifyRes.data?.code === 200) {
              setUnreadCount(notifyRes.data.data || 0);
            }
          }).catch(() => {});

          // 开启 WebSocket 极速连接
          try {
            const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
            const wsUrl = `${wsBaseUrl}/notification/${token}`;
            const ws = new window.WebSocket(wsUrl);
            ws.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                if (data.type === 'NEW_NOTIFICATION') {
                  setUnreadCount(prev => prev + 1);
                  const newToast = { id: Date.now(), senderName: data.senderName || '系统', content: data.content || '有新通知', isVisible: true };
                  setToast(newToast);
                  setTimeout(() => setToast(prev => prev?.id === newToast.id ? { ...prev, isVisible: false } : prev), 5000);
                }
              } catch (e) {}
            };
          } catch(e) {}
          
        })
        .catch(() => {
          // 如果后端返回 401，说明 token 过期或服务端重启清空了 session
          localStorage.removeItem("studytoken");
          setIsLoggedIn(false);
          setAvatarUrl(null);
        });
    } else {
      setIsLoggedIn(false);
      setAvatarUrl(null);
    }
  }, [pathname]); // 依赖 pathname 重新检查，登录后跳转回来能立刻刷新状态

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && (!dropdownRef.current.contains(event.target as Node))) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 全局快捷键唤出搜索 (Ctrl+K 或 Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    // 即使还没有后端接口，也先在前端完成登出
    localStorage.removeItem("studytoken");
    setIsLoggedIn(false);
    setIsDropdownOpen(false); // 关闭可能存在的下拉菜单
    router.push("/login");
  };

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-40 group pointer-events-none">
        {/* 唤醒区：鼠标滑到顶部 16px 范围内即可唤出导航栏 */}
        <div className="absolute top-0 inset-x-0 h-4 bg-transparent pointer-events-auto" />
        
        <header className="pointer-events-auto absolute top-0 w-full border-b border-zinc-200/50 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/60 text-zinc-900 dark:text-zinc-100 transition-all duration-300 ease-in-out -translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg tracking-tight hover:text-zinc-600 dark:hover:text-zinc-600 transition-colors">
            HelloWisdom
          </Link>
          {showNav && (
            <nav className="hidden md:flex gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <Link href="/blog" className="hover:text-zinc-900 dark:hover:text-white transition-colors">文章</Link>
              <Link href="/kb" className="hover:text-zinc-900 dark:hover:text-white transition-colors">知识库</Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
          {showNav && (
            <>
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors group"
                aria-label="搜索全局文章"
              >
                <Search className="w-4 h-4 mr-1.5" />
                搜索
                <kbd className="hidden sm:inline-flex items-center justify-center ml-2.5 px-1.5 py-[2px] text-[10px] sm:text-xs font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-md group-hover:border-zinc-300 dark:group-hover:border-white/20 transition-all">
                  <span className="text-[10px] mr-0.5">⌘</span>K
                </kbd>
              </button>
              <div className="h-4 w-px bg-zinc-300 dark:bg-white/30 mx-1"></div>
            </>
          )}

          <ThemeToggle />

          {/* 在部分页面（如首页、登录、发布）隐藏头像，仅保留单纯的顶栏 */}
          {isMounted && showNav && (
            <>
              {isLoggedIn && (
                <Link
                  href="/notifications"
                  className="relative flex items-center justify-center w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 hover:ring-2 hover:ring-zinc-900/50 dark:hover:ring-white/50 transition-all text-zinc-600 dark:text-zinc-300 sm:ml-2"
                  title="通知中心"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-2 w-2 items-center justify-center rounded-full bg-zinc-900 dark:bg-white ring-2 ring-white dark:ring-zinc-900"></span>
                  )}
                </Link>
              )}
              <div className="h-4 w-px bg-zinc-300 dark:bg-white/20 ml-2 hidden sm:block"></div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 overflow-hidden hover:ring-2 hover:ring-zinc-900/50 dark:hover:ring-white/50 transition-all focus:outline-none"
                  title="用户菜单"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  )}
                </button>

                {/* 下拉菜单 */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg py-1 z-50 transform opacity-100 scale-100 transition-all origin-top-right">
                    {isLoggedIn ? (
                      <>
                        <Link
                          href="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-full text-left flex items-center px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <User className="w-4 h-4 mr-2" />
                          个人中心
                        </Link>
                        <Link
                          href="/publish"
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-full text-left flex items-center px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <PenSquare className="w-4 h-4 mr-2" />
                          写文章
                        </Link>
                        <div className="h-px bg-zinc-200 dark:bg-white/10 my-1 mx-2"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          退出登录
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-full text-left flex items-center px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          登录
                        </Link>
                        <Link
                            href="/login?mode=register"
                          onClick={() => setIsDropdownOpen(false)}
                          className="w-full text-left flex items-center px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          注册
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </header>
      </div>

      {/* 搜索模态框和其他弹窗脱离 header 的 hover 限制，独立渲染 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* 实时 WebSocket 悬浮通知 (Toast) */}
      {toast && toast.isVisible && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right slide-in-from-top-4 fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl p-4 flex items-start gap-4 max-w-sm w-full">
            <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white p-2 rounded-full flex-shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{toast.senderName}</h4>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium ml-2 shrink-0">刚刚</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{toast.content}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0">
              <span className="sr-only">关闭</span>
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
}