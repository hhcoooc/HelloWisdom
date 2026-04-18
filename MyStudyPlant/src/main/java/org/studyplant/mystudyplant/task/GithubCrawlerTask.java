package org.studyplant.mystudyplant.task;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.checkerframework.checker.units.qual.A;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

import org.studyplant.mystudyplant.document.ArticleDoc;
import org.studyplant.mystudyplant.entity.Article;
import org.studyplant.mystudyplant.entity.KnowledgeNode;
import org.studyplant.mystudyplant.repository.ArticleRepository;
import org.studyplant.mystudyplant.repository.ArticleSearchRepository;
import org.studyplant.mystudyplant.repository.KnowledgeNodeRepository;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

/**
 * 自动拉取 GitHub 开源项目 README 填充知识库
 */
@Component
public class GithubCrawlerTask {

    // 运行状态标志：volatile 保证多线程可见性
    private volatile boolean isRunning = false;

    public boolean isRunning() {
        return isRunning;
    }

    public void stopCrawler() {
        this.isRunning = false;
    }

    @Autowired
    private KnowledgeNodeRepository knowledgeNodeRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private ArticleSearchRepository articleSearchRepository;

    @Value("${ai.siliconflow.api-key}")
    private String apiKey;

    @Value("${github.token:}")
    private String githubToken;

    @Value("${crawler.author-id:1}")
    private Long defaultAuthorId;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GithubCrawlerTask() {
        // 设置超时时间：连接 10 秒，读取 5 分钟 (300000毫秒) 
        // 解释：AI 非流式生成一整篇几千字的 Markdown 长文耗时可能达到 1~2 分钟甚至更久，所以需要充分放宽
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(300000);
        this.restTemplate = new RestTemplate(factory);
    }

    @PostConstruct
    public void init() {
        // 利用拦截器在每次向 GitHub API 发送请求时，自动带上 Token 权限头
        restTemplate.getInterceptors().add((request, body, execution) -> {
            if (githubToken != null && !githubToken.isEmpty() && request.getURI().getHost().contains("api.github.com")) {
                request.getHeaders().setBearerAuth(githubToken);
                // GitHub 官方建议添加的特定头部
                request.getHeaders().set("Accept", "application/vnd.github.v3+json");
            }
            return execution.execute(request, body);
        });
    }

    /**
     * 去掉了定时注解，改用 @Async 异步标签。
     * 当你手动调用这个方法时，它会单独开一个线程后台运行，完全不阻塞主项目！
     */
    @Async
    public void fetchAndGenerateArticles() {
        if (isRunning) {
            System.out.println("⚠️ 爬虫任务已经在运行中了，本次触发自动跳过！");
            return;
        }
        isRunning = true;
        System.out.println("========== 开始执行 GitHub 搬运任务 ==========");

        try {
            // 1. 搜索比较热门的 Java 项目（搜索条件可以随时改，比如 language:python 等）
            // 参数 per_page=10 表示一次获取并生成 10 篇文章
            String searchUrl = "https://api.github.com/search/repositories?q=language:java&sort=updated&per_page=10";
            Map<String, Object> searchResult = restTemplate.getForObject(searchUrl, Map.class);
            
            if (searchResult == null || !searchResult.containsKey("items")) {
                System.out.println("未找到项目数据。");
                return;
            }

            List<Map<String, Object>> items = (List<Map<String, Object>>) searchResult.get("items");

            for (Map<String, Object> item : items) {
                // 核心：每次拉取新项目前，检查是否被人工停止
                if (!isRunning) {
                    System.out.println(" 接收到终止指令，直接打断任务退出循环！");
                    break;
                }

                Map<String, Object> owner = (Map<String, Object>) item.get("owner");
                String ownerName = (String) owner.get("login");
                String repoName = (String) item.get("name");

                System.out.println(">>> 正在拉取项目: " + ownerName + "/" + repoName);

                try {
                    // 2. 获取项目的 README.md
                    String readmeUrl = "https://api.github.com/repos/" + ownerName + "/" + repoName + "/readme";
                    Map<String, Object> readmeData = restTemplate.getForObject(readmeUrl, Map.class);
                    
                    if (readmeData != null && readmeData.containsKey("content")) {
                        String base64Content = (String) readmeData.get("content");
                        // 清理 Base64 字符串中的换行符（这步非常重要，否则解码会报错）
                        base64Content = base64Content.replaceAll("\\s", "");
                        
                        byte[] decodedBytes = Base64.getDecoder().decode(base64Content);
                        String markdownContent = new String(decodedBytes, "UTF-8");

                        System.out.println("成功获取 Markdown 正文，原长度：" + markdownContent.length());

                        // 粗暴截断大文件：防止过长文本导致 AI 请求超时或消耗过多 Token (3000 字基本足够提取技术背景)
                        int maxLen = 3000;
                        if (markdownContent.length() > maxLen) {
                            markdownContent = markdownContent.substring(0, maxLen) + "\n\n... (由于长度限制，截断后续内容) ...";
                            System.out.println(">>> 发现超长项目 README，已由 " + maxLen + " 字符处截断！");
                        }

                        // ==========================================
                        // 3. 调用硅基流动 API (DeepSeek-V3) 生成高质量 SEO 优化文章
                        System.out.println(">>> 正在请求 AI 生成技术长文，请稍候...");
                        String aiPrompt = "你是一位资深的高级研发专家和技术专栏作家。请根据以下开源项目的 README 内容，深度创作一篇高质量的中文技术解析文章。\n" +
                                          "为了符合高质量阅读和现代 SEO 标准，请严格遵循以下规范：\n" +
                                          "1. 【长尾词标题】：生成一个吸引人且富有具体场景的长尾关键词标题（例如不要写“XX项目介绍”，而是“2026最新：基于XX技术的YY应用场景实战与架构解析”）。\n" +
                                          "2. 【高价值导读】：文章开头必须写一段200字左右的“核心导读”或“项目摘要”，提炼项目的核心痛点、应用场景和使用价值。\n" +
                                          "3. 【深度与重写】：严禁原封不动翻译或照搬！请以第三人称的技术评测视角，重新组织文章结构（包含核心特性、快速上手、技术亮点剖析、总结）。采用清晰的 Markdown 标题层级（H2/H3），自然融入专业词汇，严禁生硬堆砌。\n" +
                                          "4. 【分类与标签】：在 Markdown 正文的末尾，附上由你智能提取的 3-5 个相关技术标签（格式要求如：标签：#Java #SpringBoot）。\n\n" +
                                          "请严格按照 JSON 格式返回，仅包含 title 和 content 两个字段（摘要和标签一并排版在 content 中）。\n\n" +
                                          "项目README内容：\n" + markdownContent;
                        
                        String url = "https://api.siliconflow.cn/v1/chat/completions";
                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);
                        headers.setBearerAuth(apiKey);
                        
                        Map<String, Object> requestBody = new HashMap<>();
                        // 换成速度极快且通常在硅基流动免费的小参数模型（或者你也可以用 THUDM/glm-4-9b-chat）
                        requestBody.put("model", "deepseek-ai/DeepSeek-V3");
                        requestBody.put("response_format", Map.of("type", "json_object"));
                        requestBody.put("max_tokens", 4096); // 核心修复：放宽生成长度限制，防止写到一半被掐断导致 JSON 残缺
                        
                        Map<String, String> message = new HashMap<>();
                        message.put("role", "user");
                        message.put("content", aiPrompt);
                        requestBody.put("messages", Arrays.asList(message));

                        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                        try {
                            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
                            Map<String, Object> body = response.getBody();
                            if (body != null && body.containsKey("choices")) {
                                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                                Map<String, Object> aiMessage = (Map<String, Object>) choices.get(0).get("message");
                                String aiContent = (String) aiMessage.get("content");
                                
                                // 4. 解析 JSON 并提取内容
                                JsonNode rootNode = objectMapper.readTree(aiContent);
                                String title = rootNode.path("title").asText();
                                String content = rootNode.path("content").asText();

                                if (title != null && !title.isEmpty() && content != null && !content.isEmpty()) {
                                    Article article = new Article();
                                    article.setTitle(title);
                                    article.setContent(content);
                                    article.setAuthorId(defaultAuthorId); // 使用从配置文件中读取的装甲作者ID
                                
                                    articleRepository.save(article);

                                     // ======== 【新增这一块】：同步存入 Elasticsearch ========
                                    try {
                                        ArticleDoc doc = new ArticleDoc();
                                        doc.setId(article.getId());
                                        doc.setTitle(article.getTitle());
                                        doc.setContent(article.getContent());
                                        articleSearchRepository.save(doc); // 保存进 ES 倒排生词库
                                    } catch (Exception e) {
                                        System.err.println("AI 文章同步到 ES 引擎失败: " + e.getMessage());
                                    }
                                    // =======================================================

                                    // 【新增逻辑】拿到刚生成的文章，自动作为节点挂载到知识库 (写死在 kbId = 1 下面)
                                    KnowledgeNode node = new KnowledgeNode();
                                    node.setKbId(1L);
                                    node.setParentId(0L); // 直接丢根目录，如果以后你要分文件夹可以自己改
                                    node.setTitle(article.getTitle());
                                    node.setArticleId(article.getId()); // 绑定刚生成的爬虫文章 IDs
                                    node.setSortOrder(99); 
                                    knowledgeNodeRepository.save(node);
                                    
                                    System.out.println(">>> [模拟入库成功] AI已成功返回并且程序能够正确解析了！");
                                    System.out.println("====== 生成的文章标题 ======\n" + title);
                                    System.out.println("====== 正文前200字预览 ======\n" + content.substring(0, Math.min(200, content.length())) + "......\n");
                                } else {
                                    System.err.println("解析AI输出异常或字段不完整。");
                                }
                            }
                        } catch (Exception aiException) {
                            System.err.println("调用 AI 接口失败或数据入库失败：" + aiException.getMessage());
                        }
                        // ==========================================
                    }
                } catch (Exception e) {
                    System.err.println("--- 拉取 " + repoName + " 的 README 失败，可能没有 README文件：" + e.getMessage());
                }

                // 强制休眠 3 秒，避免触发 GitHub API 的频率限制（无 Token 限制 60次/小时）
                Thread.sleep(3000); 
            }

            if (isRunning) {
                System.out.println("========== GitHub 搬运任务完美执行完毕 ==========");
            }

        } catch (Exception e) {
            System.err.println("爬虫全局任务出错：" + e.getMessage());
        } finally {
            // 无论执行成功、报错还是被腰斩，最后必须归位成“未运行”状态
            isRunning = false;
            System.out.println(">>> 爬虫引擎状态已重置为 idle (空闲)");
        }
    }
}