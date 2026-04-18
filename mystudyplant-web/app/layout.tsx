import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'), // TODO: 替换为实际线上域名
  title: {
    template: '%s | HelloWisdom',
    default: 'HelloWisdom - 知识与探索',
  },
  description: '基于极简主义驱动的个人博客与知识库，探索硬核技术与人文思维。',
  openGraph: {
    title: 'HelloWisdom',
    description: '知识与探索的交汇点。',
    url: '/',
    siteName: 'HelloWisdom',
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HelloWisdom',
    description: '知识与探索的交汇点。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 加上 suppressHydrationWarning 防止 Next-Themes 与服务端渲染产生类名差异报错
  return (
    <html lang="zh-CN" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-zinc-900 transition-colors duration-500 ease-in-out dark:bg-[#0d1117] dark:text-zinc-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SiteHeader />
          {/* 这里去掉了原本强制宽度的 padding 和 margin，让子页面自己决定是否占满 */}
          <main className="flex-1 w-full">
            {children}
          </main>
          <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8 mt-auto">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center text-sm text-zinc-500 dark:text-zinc-500">
              &copy; {new Date().getFullYear()} HelloWisdom. Crafted with Vibe.
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
