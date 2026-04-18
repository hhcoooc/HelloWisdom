'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2, ShieldOff, AlertTriangle } from 'lucide-react';
import http from '@/src/lib/http';

interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  status: number; // 假设 1 正常, 0 封禁
  createTime: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const size = 15;

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await http.get(`/admin/users?page=${page}&size=${size}&keyword=${encodeURIComponent(search)}`);
      if (res.data?.code === 200) {
        setUsers(res.data.data?.list || []);
        setTotal(res.data.data?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleStatus = async (id: number, currentStatus: number, username: string) => {
    const actionStr = currentStatus === 1 ? '封禁' : '解封';
    if (!confirm(`确定要 对用户 [${username}] 执行【${actionStr}】操作吗？`)) return;

    try {
      // 预留的后端封禁/解封接口
      const res = await http.put(`/admin/user/${id}/status`, { status: currentStatus === 1 ? 0 : 1 });
      if (res.data?.code === 200) {
        fetchUsers();
      } else {
        alert(res.data?.message || '操作失败');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">用户管理</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">全局管控注册用户状态与行为 (共 {total} 人)</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="搜索用户名、邮箱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm transition-all"
          />
        </form>
      </div>

      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 uppercase font-medium border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4">UID</th>
              <th className="px-6 py-4">用户名</th>
              <th className="px-6 py-4">邮箱</th>
              <th className="px-6 py-4">注册时间</th>
              <th className="px-6 py-4 text-center">当前状态</th>
              <th className="px-6 py-4 text-right">管控</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mx-auto mb-4" />
                  <p className="text-zinc-500">加载用户数据中...</p>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-zinc-500">没有查找到相关用户</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-xs text-zinc-500 dark:text-zinc-400">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                    {user.email || <span className="italic opacity-50">未绑定</span>}
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                    {user.createTime?.replace('T', ' ')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.status === 1 || user.status === undefined ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">正常</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">封禁中</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      title={user.status === 1 || user.status === undefined ? '封禁该用户' : '解除封禁'}
                      onClick={() => toggleStatus(user.id, user.status === undefined ? 1 : user.status, user.username)}
                      className={`inline-flex items-center p-2 rounded-lg transition-colors ${
                        user.status === 1 || user.status === undefined
                          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                          : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10'
                      }`}
                    >
                      {user.status === 1 || user.status === undefined ? <ShieldOff className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页组件此处略，可参考文章管理的翻页 */}
    </div>
  );
}