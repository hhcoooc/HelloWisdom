'use client';

import { useEffect, useState } from 'react';
import { Users, FileText, Activity, TrendingUp, RefreshCw, BarChart } from 'lucide-react';
import http from '@/src/lib/http';

interface DashboardStats {
  totalUsers: number;
  totalArticles: number;
  totalViews: number;
  todayNewUsers: number;
  todayNewArticles: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await http.get('/admin/stats');
      if (res.data?.code === 200) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '总用户数',
      value: stats?.totalUsers || 0,
      trend: `+${stats?.todayNewUsers || 0} 今日`,
      icon: Users,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    },
    {
      title: '总文章数',
      value: stats?.totalArticles || 0,
      trend: `+${stats?.todayNewArticles || 0} 今日`,
      icon: FileText,
      color: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    },
    {
      title: '总浏览量',
      value: stats?.totalViews || 0,
      trend: '持续增长中',
      icon: Activity,
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
    },
    {
      title: '活跃度',
      value: '正常',
      trend: '近7日平稳',
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">控制台概览</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">HelloWisdom 内容与用户数据指标</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2 sm:px-4 sm:py-2.5 rounded-xl bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline font-medium text-sm">刷新数据</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-[#161b22] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{card.title}</p>
                <div className="flex items-baseline mb-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {loading ? <span className="text-zinc-300 dark:text-zinc-700">--</span> : card.value}
                  </h3>
                </div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-md inline-block">
                  {card.trend}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${card.color} shrink-0`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 text-zinc-50 dark:text-zinc-800/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform group-hover:scale-110">
              <BarChart className="w-32 h-32" />
            </div>
          </div>
        ))}
      </div>

      {/* 底部信息区块 */}
      <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm text-center py-20 flex flex-col items-center justify-center">
         <Activity className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mb-4" />
         <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">更多可视化图表功能开发中</h3>
         <p className="text-zinc-500 dark:text-zinc-400 max-w-md mt-2">
           当前显示的是核心统计数据。如需更丰富的大屏看板展示（如 ECharts 折线图、词云等），可以在未来迭代中加入。
         </p>
      </div>
    </div>
  );
}