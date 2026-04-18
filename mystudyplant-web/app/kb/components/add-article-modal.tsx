'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, Plus } from 'lucide-react';
import http from '@/src/lib/http';

interface ArticleItem {
  id: number;
  title: string;
  createTime: string;
}

export function AddArticleToKbModal({ 
  isOpen, 
  onClose, 
  kbId, 
  onSuccess 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  kbId: string | number,
  onSuccess: () => void 
}) {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyArticles();
    }
  }, [isOpen]);

  const fetchMyArticles = async () => {
    try {
      setLoading(true);
      // 获取我的发布文章列表作为知识库的候选源
      const res = await http.get('/article/my');
      if (res.data.code === 200) {
        setArticles(res.data.data.list || res.data.data || []);
      }
    } catch (error) {
      console.error('获取文章列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddArticle = async (articleId: number) => {
    try {
      setIsSubmitting(true);
      // 后端 API: 知识库绑定文章节点
      const res = await http.post(`/api/kb/${kbId}/add-article`, {
        articleId,
        parentId: 0 // 默认追加到根目录下，如果不涉及树层级可以选择去掉这个参数或由后端默认处理
      });

      if (res.data.code === 200 || res.data.message === 'success') {
        onSuccess();
        onClose(); // 成功后关闭弹窗，刷新树
      } else {
        alert(res.data.message || '添加失败');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '添加发生网络错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161b22] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 scale-in-center flex flex-col max-h-[80vh]">
        
        <div className="flex flex-shrink-0 items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/80">
          <h3 className="text-xl font-bold">导入我的文章</h3>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="搜索我的文章标题..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">
              没有找到相关的已发布文章
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredArticles.map(article => (
                <li key={article.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50">
                  <div className="pr-4 min-w-0">
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{article.title}</p>
                    <p className="text-xs text-zinc-500 mt-1">{article.createTime?.replace('T', ' ')}</p>
                  </div>
                  <button
                    onClick={() => handleAddArticle(article.id)}
                    disabled={isSubmitting}
                    className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> 导入
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}