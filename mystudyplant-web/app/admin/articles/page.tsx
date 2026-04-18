'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2, Trash2, Eye, Link as LinkIcon, AlignLeft } from 'lucide-react';
import Link from 'next/link';
import http from '@/src/lib/http';

interface AdminArticle {
  id: number;
  title: string;
  authorName: string;
  authorId: number;
  viewCount: number;
  likeCount: number;
  createTime: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const size = 10;

  useEffect(() => {
    fetchArticles();
  }, [page]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await http.get(`/admin/articles?page=${page}&size=${size}&keyword=${encodeURIComponent(search)}`);
      if (res.data?.code === 200) {
        setArticles(res.data.data?.list || []);
        setTotal(res.data.data?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch articles for admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchArticles();
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定要删除涉规文章《${title}》吗？下架后将不可恢复。`)) return;
    
    try {
      const res = await http.delete(`/admin/article/${id}`);
      if (res.data?.code === 200) {
        alert('文章已成功下架删除');
        fetchArticles();
      } else {
        alert(res.data?.message || '删除失败');
      }
    } catch (error) {
      console.error(error);
      alert('发生错误，处理失败');
    }
  };

  const totalPages = Math.ceil((total || 0) / size);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">内容管理</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">全局审阅并管理社区所有文章（共 {total} 篇）</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="搜索文章标题、作者..."
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
              <th className="px-6 py-4 rounded-tl-2xl">文章标题</th>
              <th className="px-6 py-4">作者</th>
              <th className="px-6 py-4">数据指标</th>
              <th className="px-6 py-4">发布时间</th>
              <th className="px-6 py-4 text-right rounded-tr-2xl">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mb-4" />
                    <p className="text-zinc-500">正在拉取内容数据...</p>
                  </div>
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <AlignLeft className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">没有查找到符合条件的文章。</p>
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate" title={article.title}>
                    {article.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                      {article.authorName} (ID: {article.authorId})
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-xs font-medium w-max">
                      <span className="flex items-center group cursor-help"><Eye className="w-3.5 h-3.5 mr-1" /> {article.viewCount || 0}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                      <span className="flex items-center group cursor-help">❤ {article.likeCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono text-xs whitespace-nowrap">
                    {article.createTime?.replace('T', ' ')}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <Link
                      href={`/article/${article.id}`}
                      target="_blank"
                      className="inline-flex items-center p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="前台查看"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id, article.title)}
                      className="inline-flex items-center p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="下架删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            第 {page} 页，共 {totalPages} 页
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              上一页
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}