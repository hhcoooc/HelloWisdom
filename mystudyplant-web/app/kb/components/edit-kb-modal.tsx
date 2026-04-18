'use client';

import { useState, useEffect } from 'react';
import { X, UploadCloud, BookOpen, Loader2 } from 'lucide-react';
import http from '@/src/lib/http';

export function EditKbModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  kb 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSuccess: () => void,
  kb: any 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (kb && isOpen) {
      setTitle(kb.title || '');
      setDescription(kb.description || '');
      setCoverUrl(kb.coverUrl || '');
      setErrorMsg('');
    }
  }, [kb, isOpen]);

  if (!isOpen) return null;

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setIsUploading(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);
      // 增加必须的分类参数，不然会报“文件分类不能为空”
      formData.append('category', 'ARTICLE_IMAGE');
      
      const res = await http.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 响应体可能没有统一封装，直接返回 { url: '...' }
      const newUrl = res.data?.url || res.data?.data;
      if (newUrl || res.data?.code === 200) {
        setCoverUrl(newUrl);
      } else {
        setErrorMsg(res.data.message || '上传封面失败');
      }
    } catch (error) {
      console.error('上传封面错误:', error);
      setErrorMsg('上传出错，请稍后重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('知识库名称不能为空');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      // 后端 API: 更新知识库
      const res = await http.put(`/api/kb/${kb.id}`, {
        title,
        description,
        coverUrl
      });

      if (res.data.code === 200 || res.data.message === 'success') {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.data.message || '保存失败');
      }
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161b22] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 scale-in-center">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/80">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            编辑知识库
          </h3>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">知识库封面 (可选)</label>
            <div className="relative group cursor-pointer border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-[#0a0d14] overflow-hidden hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all text-center h-32 flex items-center justify-center">
              {coverUrl ? (
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-6 h-6 text-zinc-400 mb-2 group-hover:text-blue-500 transition-colors" />
                  <span className="text-xs text-zinc-500 group-hover:text-blue-600">点击上传封面图片</span>
                </div>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleUploadCover} disabled={isUploading} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">知识库名称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="例如：Spring Boot 源码解析"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">简介说明 (可选)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none min-h-[80px]"
              placeholder="一句话介绍这个知识库包含的内容..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}