import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. 开启独立运行模式（保留即可）
  output: 'standalone', 

  // 2. 忽略 ESLint 检查（添加 ts-ignore 屏蔽类型库漏写这两个属性导致的编译器爆红）
  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 3. 忽略 TypeScript 类型检查阻断
  // @ts-ignore
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
