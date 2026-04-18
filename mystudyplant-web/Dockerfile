# 基础环境：使用轻量级的 Node 镜像
# 原因：Alpine 体积小且安全，提供极简的运行时基座。
FROM node:20-alpine AS base

# 构建阶段：安装依赖并编译项目源码
# 原因：合并依赖安装与构建阶段，避免跨阶段 copy node_modules 造成的符号链接或原生依赖丢失问题。
FROM base AS builder
WORKDIR /app
COPY . .
RUN npm install
# 如果有构建期的环境变量请在此配置
# ENV NEXT_PUBLIC_API_URL=${API_URL}
RUN npm run build

# 运行阶段：打包最终的生成环境镜像
# 原因：摒弃完整源码和庞大的 node_modules，只保留 standalone 产物，减小镜像体积并降低攻击面。
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# 安全加固：创建非 root 用户运行服务
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# 复制 Next.js 独立运行包的核心文件并剥夺 root 权限
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 暴露端口与运行配置
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]