'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import http from '@/src/lib/http';
import Link from 'next/link';
import { Eye, ThumbsUp, CalendarDays, LogOut, Edit3, User, PenSquare, Star, Mail, X, CheckCircle2, History, BookOpen, Trash2 } from 'lucide-react';
import { EditKbModal } from '@/app/kb/components/edit-kb-modal';

interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
}

interface Article {
  id: number;
  title: string;
  summary: string;
  imageUrl?: string;
  viewCount: number;
  likeCount: number;
  createTime: string;
}

interface KnowledgeBase {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  authorName: string;
  authorAvatar?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'published' | 'liked' | 'favorites' | 'history' | 'drafts' | 'my-kbs'>('published');
  const [myArticles, setMyArticles] = useState<Article[]>([]);
  const [likedArticles, setLikedArticles] = useState<Article[]>([]);
  const [favoriteArticles, setFavoriteArticles] = useState<Article[]>([]);
  const [historyArticles, setHistoryArticles] = useState<Article[]>([]);
  const [draftArticles, setDraftArticles] = useState<Article[]>([]);
  const [myKbs, setMyKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditKbModal, setShowEditKbModal] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBase | null>(null);
  // === 修改个人信息状态 ===
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // 1. 获取当前登录用户信息
      const userRes = await http.get('/users/info');
      // axios 封装的完整响应体存在 .data 属性下
      if (userRes.data.code === 200) {
        setUser(userRes.data.data);
      } else {
        router.push('/login'); // 未响应 200 跳转到登录页
        return;
      }

      // 2. 并行获取：我的发布、我点赞的、等 和 我的专栏
      const [publishedRes, likedRes, favoritesRes, historyRes, draftsRes, myKbsRes] = await Promise.all([
        http.get('/article/my').catch(() => null),
        http.get('/article/my/liked').catch(() => null),
        http.get('/api/favorites/my').catch(() => null),
        http.get('/article/my/history').catch(() => null),
        http.get('/article/my/drafts').catch(() => null),
        http.get('/api/kb/my').catch(() => null),
      ]);

      if (publishedRes && publishedRes.data.code === 200) {
        const resultData = publishedRes.data.data;
        setMyArticles(resultData.list || resultData || []);
      }

      if (likedRes && likedRes.data.code === 200) {
        const resultData = likedRes.data.data;
        setLikedArticles(resultData.list || resultData || []);
      }

      if (favoritesRes && favoritesRes.data.code === 200) {
        const resultData = favoritesRes.data.data;
        setFavoriteArticles(resultData.list || resultData || []);
      }

      if (historyRes && historyRes.data.code === 200) {
        const resultData = historyRes.data.data;
        setHistoryArticles(resultData.list || resultData || []);
      }

      if (draftsRes && draftsRes.data.code === 200) {
        const resultData = draftsRes.data.data;
        setDraftArticles(resultData.list || resultData || []);
      }

      if (myKbsRes && myKbsRes.data.code === 200) {
        const resultData = myKbsRes.data.data;
        setMyKbs(resultData.list || resultData || []);
      }
    } catch (error) {
      console.error('获取个人信息失败 (可能 token 过期):', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studytoken'); // 改成存储 token 对应的实际 Key
    router.push('/login');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await http.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.code === 200) {
        const newAvatarUrl = res.data.data;
        setUser((prev) => prev ? { ...prev, avatar: newAvatarUrl } : null);
      } else {
        alert(res.data.message || '上传头像失败');
      }
    } catch (error) {
      console.error('上传头像错误:', error);
      alert('网络错误，请稍后再试');
    }
  };

  const openEditModal = () => {
    if (user) {
      setEditUsername(user.username || '');
      setEditEmail(user.email || '');
      setEditError('');
      setEditSuccess(false);
      setShowEditModal(true);
    }
  };

  const submitEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess(false);

    try {
      // 预期的后端地址是 PUT 或 POST /users/profile
      const res = await http.post('/users/profile', {
        username: editUsername,
        email: editEmail,
      });

      if (res.data?.code === 200 || res.data?.message === 'success' || res.data?.message === '更新个人信息成功') {
        setEditSuccess(true);
        setUser(prev => prev ? { ...prev, username: editUsername, email: editEmail } : null);
        setTimeout(() => {
          setShowEditModal(false);
        }, 1500);
      } else {
        setEditError(res.data?.message || '保存失败');
      }
    } catch (error: any) {
      console.error('保存报错:', error);
      setEditError(error.response?.data?.message || error.response?.data?.msg || error.message || '网络或服务端原因导致保存失败');
    } finally {
      setEditLoading(false);
    }
  };

  const openKbEditModal = (kb: KnowledgeBase) => {
    setEditingKb(kb);
    setShowEditKbModal(true);
  };

  const handleDeleteKb = async (kbId: number) => {
    if (!confirm('确定要删除这个专栏吗？删除后将无法恢复。')) return;
    try {
      const res = await http.delete(`/api/kb/${kbId}`);
      if (res.data.code === 200 || res.data.message === 'success') {
        fetchUserData(); // 删完重刷
      } else {
        alert(res.data.message || '删除专栏失败');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '网络或服务器错误，删除失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] pt-16 flex items-center justify-center bg-zinc-50/50 dark:bg-[#0a0d14]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }

  const currentList = activeTab === 'published' ? myArticles : (activeTab === 'drafts' ? draftArticles : (activeTab === 'liked' ? likedArticles : (activeTab === 'favorites' ? favoriteArticles : (activeTab === 'my-kbs' ? [] : historyArticles))));

  return (
    <div className="min-h-[calc(100vh-4rem)] pt-24 pb-12 bg-zinc-50/50 dark:bg-[#0a0d14] text-zinc-900 dark:text-zinc-100 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* 个人信息头部 */}
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start justify-between shadow-sm transition-colors">
          <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 relative">
            <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-zinc-800 dark:bg-zinc-700/50 rounded-full flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-md shrink-0 border-4 border-white dark:border-[#161b22] z-10 relative overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.username?.[0]?.toUpperCase() || <User size={40} />
                )}
                {/* 悬浮上传遮罩与图标 */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <PenSquare className="w-6 h-6 text-white mb-1" />
                  <span className="text-xs text-white font-medium">修改头像</span>
                </div>
              </div>
              {/* 头像发光背景点缀 */}
              <div className="absolute inset-0 bg-zinc-400 dark:bg-zinc-600 blur-xl opacity-30 rounded-full z-0"></div>
              {/* 隐藏的图片上传 Input */}
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                className="hidden" 
                onChange={handleAvatarUpload} 
              />
            </div>
            <div className="text-center sm:text-left z-10 flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {user?.username}
                </h1>
                <button
                  onClick={openEditModal}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="编辑个人信息"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700/50 font-medium whitespace-nowrap">
                  UID: {user?.id}
                </span>
                {user?.email && (
                  <span className="bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700/50 font-medium flex items-center gap-1.5 whitespace-nowrap">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 z-10">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </button>
          </div>
        </div>

        {/* 内容区域：Tab 切换 */}
        <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm overflow-hidden transition-colors">
          <div className="border-b border-zinc-200 dark:border-zinc-800/80 px-2 sm:px-6 pt-2 flex space-x-4 sm:space-x-8 overflow-x-auto no-scrollbar">
            <button
              className={`pb-4 px-2 sm:px-4 whitespace-nowrap border-b-2 font-medium text-sm sm:text-base transition-all ${
                activeTab === 'published'
                  ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              onClick={() => setActiveTab('published')}
            >
              我的发布
            </button>
            <button
              className={`pb-4 px-2 sm:px-4 whitespace-nowrap border-b-2 font-medium text-sm sm:text-base transition-all ${
                activeTab === 'my-kbs'
                  ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              onClick={() => setActiveTab('my-kbs')}
            >
              我的专栏
            </button>
            <button
              className={`pb-4 px-2 sm:px-4 whitespace-nowrap border-b-2 font-medium text-sm sm:text-base transition-all ${
                activeTab === 'drafts'
                  ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              onClick={() => setActiveTab('drafts')}
            >
              草稿箱
            </button>
            <button
              className={`pb-4 px-2 sm:px-4 whitespace-nowrap border-b-2 font-medium text-sm sm:text-base transition-all ${
                activeTab === 'liked'
                  ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              onClick={() => setActiveTab('liked')}
            >
              我赞过的
            </button>
            <button
              className={`pb-4 px-2 sm:px-4 whitespace-nowrap border-b-2 font-medium text-sm sm:text-base transition-all ${
                activeTab === 'favorites'
                  ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              onClick={() => setActiveTab('favorites')}
            >
              我收藏的
            </button>
            <button
              className={`pb-4 px-2 sm:px-4 whitespace-nowrap border-b-2 font-medium text-sm sm:text-base transition-all ${
                activeTab === 'history'
                  ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              onClick={() => setActiveTab('history')}
            >
              阅读历史
            </button>
          </div>
          
          <div className="min-h-[300px]">
            {activeTab === 'my-kbs' ? (
              myKbs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 py-24 animate-in fade-in duration-500">
                  <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                    <BookOpen className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <p className="mb-6 font-medium text-zinc-600 dark:text-zinc-300">您还没有创建过专栏，快去建立自己的知识库吧～</p>
                  <Link href="/kb" className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-full text-sm font-medium transition-colors shadow-sm">
                    去专栏区
                  </Link>
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myKbs.map((kb) => (
                    <div key={kb.id} className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:border-black hover:shadow-lg dark:hover:border-white transition-all">
                      {kb.coverUrl ? (
                        <div className="h-32 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 relative">
                          <img src={kb.coverUrl} alt={kb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="h-32 w-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center shrink-0">
                          <BookOpen className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                        </div>
                      )}
                      
                      <div className="p-4 flex-1 flex flex-col">
                        <Link href={`/kb/${kb.id}`}>
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-1 hover:text-blue-500">
                            {kb.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 h-8 flex-1">
                          {kb.description || '暂无简介...'}
                        </p>

                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                          <button 
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                            onClick={() => openKbEditModal(kb)}
                          >
                            <Edit3 className="w-3.5 h-3.5" /> 编辑
                          </button>
                          <button 
                            className="flex items-center justify-center py-1.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium transition-colors"
                            onClick={() => handleDeleteKb(kb.id)}
                            title="删除专栏"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : currentList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 py-24 animate-in fade-in duration-500">
                {activeTab === 'published' ? (
                  <>
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                      <PenSquare className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <p className="mb-6 font-medium text-zinc-600 dark:text-zinc-300">暂无发布文章</p>
                    <Link href="/publish" className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-full text-sm font-medium transition-colors shadow-sm">
                      开始创作
                    </Link>
                  </>
                ) : activeTab === 'liked' ? (
                  <>
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                      <ThumbsUp className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <p className="font-medium text-zinc-600 dark:text-zinc-300">去点赞几篇文章再来看看吧～</p>
                  </>
                ) : activeTab === 'drafts' ? (
                  <>
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                      <Edit3 className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <p className="mb-6 font-medium text-zinc-600 dark:text-zinc-300">草稿箱空空如也，去记录些灵感吧～</p>
                    <Link href="/publish" className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-full text-sm font-medium transition-colors shadow-sm">
                      撰写新草稿
                    </Link>
                  </>
                ) : activeTab === 'favorites' ? (
                  <>
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                      <Star className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <p className="font-medium text-zinc-600 dark:text-zinc-300">遇到喜欢的文章不如收藏下来吧～</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                      <History className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <p className="font-medium text-zinc-600 dark:text-zinc-300">暂无阅读历史记录～</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                {currentList.map((article) => {
                  // 这里用强大的正则过滤掉可能残留在 summary 里的完整或断裂的图片/链接语法
                  let cleanSummary = article.summary || '';
                  // 1. 清除 HTML <img> 标签
                  cleanSummary = cleanSummary.replace(/<img[^>]*>/gi, '');
                  // 2. 清除 Markdown 图片（包括可能因为字符截断导致的未闭合情况）
                  cleanSummary = cleanSummary.replace(/!\[.*?\]\([^\)]*\)?/g, '');
                  // 3. 清除普通的 Markdown 链接，只保留文字部分
                  cleanSummary = cleanSummary.replace(/\[([^\]]+)\]\([^\)]*\)?/g, '$1');
                  // 4. 清除摘要中裸露的纯 http/https 链接
                  cleanSummary = cleanSummary.replace(/https?:\/\/[^\s]+/g, '');

                  return (
                  <div key={article.id} className="group relative border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <Link href={`/article/${article.id}`} className="flex flex-1 pr-6 w-full gap-5">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors truncate">
                          {article.title}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-2.5 text-sm line-clamp-2 leading-relaxed">
                          {cleanSummary}
                        </p>
                      <div className="flex flex-wrap items-center text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-4 gap-4 sm:gap-6">
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4" /> {article.viewCount || 0}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <ThumbsUp className="w-3.5 h-3.5" /> {article.likeCount || 0}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5" /> 
                            {article.createTime ? article.createTime.toString().split('T')[0] : '刚刚'}
                          </span>
                        </div>
                      </div>
                      
                      {/* 如果该文章带有封面图，将图片渲染出来 */}
                      {article.imageUrl && (
                        <div className="hidden sm:block shrink-0 w-32 h-24 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                          <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      )}
                    </Link>
                    
                    {(activeTab === 'published' || activeTab === 'drafts') && (
                      <div className="mt-4 sm:mt-0 self-end sm:self-center shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-4">
                        <Link 
                          href={`/publish?id=${article.id}`} 
                          className="flex items-center px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-900 dark:hover:border-white shadow-sm transition-all"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          编辑
                        </Link>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>

      <EditKbModal 
        isOpen={showEditKbModal} 
        onClose={() => setShowEditKbModal(false)}
        onSuccess={() => {
          fetchUserData();
        }}
        kb={editingKb}
      />

      {/* 编辑个人信息 Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161b22] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 scale-in-center">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/80">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">修改个人信息</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitEditProfile} className="p-5">
              {editSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                  <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">修改成功</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">你的个人资料已更新</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      用户名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 dark:focus:ring-white/20 dark:focus:border-white transition-all dark:text-zinc-100"
                      placeholder="输入新的用户名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      邮箱 (可选)
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#0a0d14] border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 dark:focus:ring-white/20 dark:focus:border-white transition-all dark:text-zinc-100"
                      placeholder="输入绑定的邮箱"
                    />
                  </div>
                  
                  {editError && (
                    <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                      {editError}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={editLoading || !editUsername.trim()}
                      className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-zinc-900 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 dark:disabled:hover:bg-zinc-100 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      {editLoading ? '保存中...' : '保存修改'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
