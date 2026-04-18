import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden">
      {/* 动态/全屏壁纸背景 */}
      <div className="absolute inset-0 -z-20 w-screen h-screen">
        <Image 
          src="/bg-moonlight.jpg" 
          alt="月光下的德累斯顿" 
          fill
          priority
          className="object-cover object-center transition-transform duration-10000 hover:scale-105"
        />
        {/* 全局暗色遮罩，保证文字可读性 */}
        <div className="absolute inset-0 bg-black/30 dark:bg-black/50 transition-colors duration-500"></div>
      </div>

      {/* 中央主视窗区域 (带毛玻璃效果的卡片) */}
      <div className="z-10 flex flex-col items-center justify-center p-8 md:p-16 text-center backdrop-blur-md bg-white/10 dark:bg-black/30 rounded-3xl border border-white/20 shadow-2xl">
        <h1
          className="mb-6 font-serif italic text-6xl md:text-8xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
        >
          Welcome HelloWisdom
        </h1>
        
        <p className="mb-10 max-w-lg text-lg text-white/90 md:text-xl font-medium tracking-wide drop-shadow-md">
          保持极简与纯粹，记录技术点滴。<br/>
          Keep it simple, stupid.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* 阅读博客按钮 */}
          <Link
            href="/blog"
            className="px-8 py-3.5 rounded-full bg-white/90 text-black font-semibold text-sm transition-transform duration-300 hover:scale-105 hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            阅读文章
          </Link>

          {/* 登录界面的入口按钮 */}
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-full bg-black/30 border border-white/30 text-white font-semibold text-sm transition-all duration-300 hover:bg-black/50 hover:border-white/50 backdrop-blur-sm"
          >
            登录
          </Link>
        </div>
      </div>
    </div>
  );
}
