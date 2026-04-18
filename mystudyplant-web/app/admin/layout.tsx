'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Loader2, ShieldAlert } from 'lucide-react';
import http from '@/src/lib/http';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      // 获取当前登录用户信息
      const { data } = await http.get('/users/info');
      
      if (data.code === 200) {
        const user = data.data;
        // 严格判断：假设你的后端返回了 role 字段并且管理员是 'ADMIN'（或者 isAdmin 为 true）
        // 如果你的后端表示管理员的字段是其他名字（比如 roleId === 1），请把这里同步修改：
        if (user?.id === 1) { // 极简方案：直接判断用户ID为1的就是管理员
          setIsAdmin(true);
        } else {
          // 不是管理员的普通账号，直接在这里被拦截，不渲染后台任何组件，立马踢回首页
          alert('⚠️ 访问被拒绝：该账号无后台管理权限！');
          router.replace('/');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Admin check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0a0d14]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-white" />
        <p className="mt-4 text-sm text-zinc-500">正在验证管理员权限...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  const navItems = [
    { href: '/admin', label: '控制台总览', icon: LayoutDashboard },
    { href: '/admin/articles', label: '内容管理', icon: FileText },
    { href: '/admin/users', label: '用户管理', icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#0a0d14] text-zinc-900 dark:text-zinc-100">
      {/* 侧边栏 */}
      <aside className="w-64 bg-white dark:bg-[#161b22] border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden sm:flex fixed h-full">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <ShieldAlert className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-500" />
          <span className="font-bold text-lg tracking-tight">Wisdom Admin</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-white' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600 dark:text-blue-500' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <Link href="/" className="flex items-center px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            返回前台首页
          </Link>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 sm:ml-64 flex flex-col min-h-screen">
        {/* 移动端顶部导航 (简易版) */}
        <header className="sm:hidden h-16 bg-white dark:bg-[#161b22] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-bold">Admin</span>
          </div>
          <Link href="/" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">返回前台</Link>
        </header>

        <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}