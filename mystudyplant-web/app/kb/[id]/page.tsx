'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from '@/src/lib/http';
import { SiteHeader } from '@/components/site-header';
import { ChevronRight, ChevronDown, Folder, FileText, Loader2, BookOpen, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AddArticleToKbModal } from '../components/add-article-modal';

interface KnowledgeNode {
  id: number;
  parentId: number;
  title: string;
  articleId: number | null;
  children?: KnowledgeNode[];
}

export default function KnowledgeBaseReader() {
  const params = useParams();
  const kbId = params.id;
  
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
  
  const [articleContent, setArticleContent] = useState<any>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (kbId) {
      fetchTree();
    }
  }, [kbId]);

  const fetchTree = async () => {
    try {
      setIsLoadingTree(true);
      // NOTE: 这里的后端接口 /api/kb/{kbId}/tree 由用户编写
      // 期望返回带有 children 的树状结构数组
      const res = await axios.get(`/api/kb/${kbId}/tree`);
      if (res.data.code === 200) {
        setNodes(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tree:', error);
    } finally {
      setIsLoadingTree(false);
    }
  };

  const fetchArticle = async (articleId: number) => {
    try {
      setIsLoadingArticle(true);
      const res = await axios.get(`/article/${articleId}`);
      if (res.data.code === 200) {
        setArticleContent(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setIsLoadingArticle(false);
    }
  };

  const toggleNode = (node: KnowledgeNode) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(node.id)) {
      newSet.delete(node.id);
    } else {
      newSet.add(node.id);
    }
    setExpandedNodes(newSet);

    if (node.articleId) {
      setActiveArticleId(node.articleId);
      fetchArticle(node.articleId);
    }
  };

  const renderTree = (nodeList: KnowledgeNode[], level = 0) => {
    return (
      <ul className="space-y-1">
        {nodeList.map(node => {
          const isExpanded = expandedNodes.has(node.id);
          const isActive = activeArticleId === node.articleId;
          const hasChildren = node.children && node.children.length > 0;
          
          return (
            <li key={node.id}>
              <div 
                onClick={() => toggleNode(node)}
                className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
              >
                <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  {hasChildren ? (
                    isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                  ) : null}
                </span>
                
                {hasChildren || !node.articleId ? (
                  <Folder className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                ) : (
                  <FileText className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-black dark:text-white' : 'text-zinc-400'}`} />
                )}
                
                <span className="truncate text-sm">{node.title}</span>
              </div>
              
              {hasChildren && isExpanded && (
                <div>
                  {renderTree(node.children!, level + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
      <SiteHeader />
      
      <div className="flex flex-1 overflow-hidden border-t border-zinc-200 dark:border-zinc-800">
        {/* Left Sidebar - Tree Directory */}
        <aside className="w-64 md:w-80 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 flex flex-col">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> 目录检索
            </h2>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
              title="添加文章到专栏"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {isLoadingTree ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : nodes.length === 0 ? (
              <div className="text-center p-8 text-sm text-zinc-500">
                等待后端返回目录数据
              </div>
            ) : (
              renderTree(nodes)
            )}
          </div>
        </aside>

        {/* Right Content - Article Reader */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 relative scrollbar-thin">
          {isLoadingArticle ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-950/50 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : null}

          {articleContent ? (
            <div className="max-w-4xl mx-auto px-8 py-12">
              <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-8 leading-tight">
                {articleContent.title}
              </h1>
              
              <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-a:text-zinc-900 dark:prose-a:text-blue-400 prose-img:rounded-xl">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      return (
                        <code className={className} style={{background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px'}} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {articleContent.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p>请在左侧目录选择文章阅读</p>
            </div>
          )}
        </main>
      </div>

      <AddArticleToKbModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        kbId={kbId as string} 
        onSuccess={fetchTree} 
      />
    </div>
  );
}
