import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000';    
  // 服务端组件(SSR/SSG)使用专门的内部内网地址直连 Java 容器，避免抛出 Invalid URL
  const apiUrl = process.env.INTERNAL_API_URL || 'http://localhost:8080';    

  let articles: Array<{ id: number, updateTime?: string, createTime?: string }> = [];

  try {
    // 采用后端准备的纯净轻量级 sitemap 专用接口
    const res = await fetch(`${apiUrl}/article/sitemap`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      articles = json?.data || [];
    }
  } catch (error) {
    console.error('Sitemap fetch articles error:', error);
  }

  const articleEntries = articles.map(article => ({
    url: `${baseUrl}/article/${article.id}`,
    lastModified: article.updateTime ? new Date(article.updateTime) : (article.createTime ? new Date(article.createTime) : new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kb`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...articleEntries,
  ]
}