'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Search, ArrowRight, Loader2, PlusCircle } from 'lucide-react';
import axios from '@/src/lib/http';
import { SiteHeader } from '@/components/site-header';
import { CreateKbModal } from './components/create-kb-modal';

interface KnowledgeBase {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  authorName: string;
  authorAvatar?: string;
}

export default function KnowledgeBaseList() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchKBs();
  }, []);

  const fetchKBs = async () => {
    try {
      setIsLoading(true);
      // NOTE: 这里的后端接口 /api/kb/list 由用户编写
      const res = await axios.get('/api/kb/list');
      if (res.data.code === 200) {
        setKbs(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge bases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader />
      
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-black dark:text-white" />
              知识库专栏
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              系统性学习，从这里开始
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text"
                placeholder="搜索专栏..."
                className="w-full md:w-64 pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm"
              />
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-medium text-sm rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              创建专栏
            </button>
          </div>
        </div>

        <CreateKbModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchKBs} 
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400 dark:text-zinc-600" />
          </div>
        ) : kbs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">暂无专栏</h3>
            <p className="text-zinc-500 dark:text-zinc-400">后端接口 /api/kb/list 暂未返回数据。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kbs.map((kb) => (
              <Link 
                href={`/kb/${kb.id}`} 
                key={kb.id}
                className="group block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-black hover:shadow-lg dark:hover:border-white transition-all"
              >
                {kb.coverUrl ? (
                  <div className="h-40 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img 
                      src={kb.coverUrl} 
                      alt={kb.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-40 w-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
                  </div>
                )}
                
                <div className="p-5">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1">
                    {kb.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 h-10">
                    {kb.description || '暂无简介...'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <img 
                        src={kb.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${kb.authorName || 'user'}`} 
                        className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover" 
                        alt="" 
                      />
                      <span>{kb.authorName || '作者'}</span>
                    </div>
                    <span className="flex items-center gap-1 font-medium group-hover:text-black dark:group-hover:text-white transition-colors">
                      进入阅读 <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
