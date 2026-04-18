# 基础环境：使用带 Maven 的 JDK 镜像作为编译环境
# 原因：通过容器内编译，保证构建环境的一致性，不需要本机安装特定版本的 Maven/JDK。
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

# 依赖下载阶段：先拷贝 pom.xml 并下载依赖
# 原因：充分利用 Docker 层缓存机制，只要 pom.xml 不变，就不会重新下载全量依赖。
COPY pom.xml .
RUN mvn dependency:go-offline

# 编译打包阶段：拷贝源代码并生成可执行的 jar 包
# 原因：真正的业务代码编译，跳过测试以加快打包速度。
COPY src ./src
RUN mvn clean package -DskipTests

# 运行环境：使用极简的 JRE Alpine 镜像作为最终运行基座
# 原因：运行时不需要 Maven 和完整的 JDK，只需要 JRE，能大幅缩减镜像体积并减少安全漏洞。
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 拷贝产物：从 builder 阶段拿到编译好的 jar 文件并重命名
# 原因：剥离原始代码，仅保留最终的字节码产品用于生产运行。
COPY --from=builder /build/target/*.jar app.jar

# 暴露后端端口与启动命令
# 占位符提示：如果有自定义的 JVM 参数，可以通过 ${JAVA_OPTS} 运行时注入
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
