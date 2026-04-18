import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }> | { id: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3922';  
    const res = await fetch(`${apiUrl}/article/${resolvedParams.id}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Fetch failed');
    const json = await res.json();
    const article = json?.data;
    
    if (!article) return { title: '文章未找到 | HelloWisdom' };

    // 使用后端专门准备的 summary 和 coverImage 以提供最佳 SEO 效果
    const description = article.summary || '暂无简介';
    const coverImage = article.coverImage;

    return {
      title: `${article.title} - HelloWisdom`,
      description,
      openGraph: {
        title: article.title,
        description,
        type: 'article',
        authors: article.authorName ? [article.authorName] : undefined,
        images: coverImage ? [coverImage] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description,
        images: coverImage ? [coverImage] : [],
      }
    };
  } catch (error) {
    return { title: '文章详情 | HelloWisdom', description: '基于极简主义的深度阅读与知识分享中心。' };
  }
}

export default function ArticleLayout({ children }: Props) {
  return <>{children}</>;
}