package org.studyplant.mystudyplant.service;

import com.fasterxml.jackson.databind.ObjectMapper;

import ch.qos.logback.core.joran.util.beans.BeanUtil;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.autoconfigure.wavefront.WavefrontProperties.Application;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.studyplant.mystudyplant.common.CursorResult;
import org.studyplant.mystudyplant.common.converter.ArticleConverter;
import org.studyplant.mystudyplant.document.ArticleDoc;
import org.studyplant.mystudyplant.dto.ArticlePublishRequest;import org.studyplant.mystudyplant.dto.ArticleUpdateRequest;import org.studyplant.mystudyplant.dto.LikeResult;
import org.studyplant.mystudyplant.entity.Article;
import org.studyplant.mystudyplant.entity.User;
import org.studyplant.mystudyplant.entity.Notification;
import org.studyplant.mystudyplant.event.ArticlePublishedEvent;
import org.studyplant.mystudyplant.event.NotificationEvent;
import org.studyplant.mystudyplant.repository.ArticleRepository;
import org.studyplant.mystudyplant.repository.ArticleSearchRepository;
import org.studyplant.mystudyplant.repository.CommentRepository;
import org.studyplant.mystudyplant.vo.ArticleListItemVO;
import org.studyplant.mystudyplant.vo.ArticleVO;

import cn.dev33.satoken.stp.StpUtil;
import io.netty.util.internal.StringUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.util.StringUtils;

@Service
@Slf4j
@RequiredArgsConstructor
public class ArticleService {
    private final ArticleRepository articleRepository;
    private final CommentRepository commentRepository;
    private final UserService userService;
    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;  // final 字段，由构造器注入
    private final ArticleSearchRepository articleSearchRepository; 
    private final ArticleConverter articleConverter;
    //注入收藏服务，用于更新收藏数
    private final org.studyplant.mystudyplant.repository.UserFavoriteRepository userFavoriteRepository;

    @Transactional
    public Article publishArticle(ArticlePublishRequest request){
        //获取当前登录用户的ID
        Long authorId = StpUtil.getLoginIdAsLong();

        //检验文章标题和内容是否为空
        if(!StringUtils.hasText(request.getTitle()) ||!StringUtils.hasText(request.getContent())){
            throw new RuntimeException("文章标题和内容不能为空");
        }

        //创建文章对象
        Article article = new Article();
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setImageUrl(request.getImageUrl());//设置封面图片URL,可能为null
        article.setAuthorId(authorId);
        article.setCategoryId(request.getCategoryId());

        // ====== 【新增逻辑：生成摘要与保存时间】 ======
        String pureText = request.getContent()
               .replaceAll("(?s)<[^>]+>", "")   // 去除 HTML 标签
               .replaceAll("!\\[.*?\\]\\(.*?\\)|\\[.*?\\]\\(.*?\\)", "") // 去掉 Markdown 图片与链接
               .replaceAll("[#>*_`~-]", "")     // 去除基础 Markdown 符号
               .replaceAll("\\s+", " ").trim(); // 多个换行/空格合并
        String summary = pureText.length() > 150 ? pureText.substring(0, 150) + "..." : pureText;
        article.setSummary(summary);
        
        article.setCreateTime(LocalDateTime.now());
        article.setUpdateTime(LocalDateTime.now());
        // ===================================

        Article savedArticle = articleRepository.save(article);

        String countKey = "article:viewCount:" + savedArticle.getId();
        stringRedisTemplate.opsForValue().setIfAbsent(countKey, "0");
        eventPublisher.publishEvent(new ArticlePublishedEvent(this, savedArticle.getId()));
        return savedArticle;
    }

    @Transactional
    public Article updateArticle(ArticleUpdateRequest request) {
        Long authorId = StpUtil.getLoginIdAsLong();
        String currentUsername = userService.getUserNameById(authorId);

        Article article = articleRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("操作已拒绝：文章不存在"));

        if (!article.getAuthorId().equals(authorId) && !"admin".equals(currentUsername)) {
            throw new RuntimeException("操作已拒绝：您没有权限修改该文章");
        }

        if (!StringUtils.hasText(request.getTitle()) || !StringUtils.hasText(request.getContent())) {
            throw new RuntimeException("文章标题和内容不能为空");
        }

        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setImageUrl(request.getImageUrl());
        article.setCategoryId(request.getCategoryId());

        // ====== 【新增逻辑：重新计算摘要，并刷新修改时间】 ======
        String pureText = request.getContent()
               .replaceAll("(?s)<[^>]+>", "")
               .replaceAll("!\\[.*?\\]\\(.*?\\)|\\[.*?\\]\\(.*?\\)", "")
               .replaceAll("[#>*_`~-]", "")
               .replaceAll("\\s+", " ").trim();
        String summary = pureText.length() > 150 ? pureText.substring(0, 150) + "..." : pureText;
        article.setSummary(summary);
        
        article.setUpdateTime(LocalDateTime.now());
        // ===================================

        Article savedArticle = articleRepository.save(article);
        
        // 删除文章详情的缓存
        String detailKey = "article:detail:" + article.getId();
        stringRedisTemplate.delete(detailKey);
        
        return savedArticle;
    }

    public CursorResult<ArticleListItemVO> getArticlePage(Long cursorId, int pageSize, Long categoryId){
        Pageable pageable = PageRequest.of(0, pageSize);//不使用分页页码，只用size限制条数
        
        List<Article> articles;
   if (cursorId == null) {
        // 首次加载
        if (categoryId == null) {
            articles = articleRepository.findByStatusOrderByIdDesc(1, pageable);
        } else {
            articles = articleRepository.findByCategoryIdAndStatusOrderByIdDesc(categoryId, 1, pageable);
        }
    } else {
        // 游标加载：取id小于cursorId的记录
        if (categoryId == null) {
            articles = articleRepository.findByIdLessThanAndStatusOrderByIdDesc(cursorId, 1, pageable);
        } else {
            articles = articleRepository.findByIdLessThanAndCategoryIdAndStatusOrderByIdDesc(cursorId, categoryId, 1, pageable);
        }
    }

      // 转换为VO列表（使用注入的 Converter 进行转换）
    List<ArticleListItemVO> vos = articles.stream()
            .map(articleConverter::toListItemVO)
            .collect(Collectors.toList());
    // 计算下一页游标：如果本次取出的记录数等于pageSize，说明可能还有下一页，取最后一条的id作为游标；否则为null
    Long nextCursor = vos.size() == pageSize ? vos.get(vos.size() - 1).getId() : null;

            return new CursorResult<>(vos, nextCursor);
        }
    

    public ArticleVO getArticleDetail(Long id){
        String detailKey = "article:detail:" + id;
        String viewCountKey = "article:viewCount:" + id;
        String likeCountKey = "article:likeCount:" + id;

        String json = stringRedisTemplate.opsForValue().get(detailKey);
        Article article = null;

        if(json != null){
            try {
                article = objectMapper.readValue(json,Article.class);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        //如果redis没有，从Pre中查询
        if(article == null){
            article = articleRepository.findById(id).orElseThrow(() -> new RuntimeException("文章不存在"));
            try {
                String ArticleJson = objectMapper.writeValueAsString(article);
                stringRedisTemplate.opsForValue().set(detailKey,ArticleJson,1,TimeUnit.HOURS);
            } catch (Exception e) {
                log.error("写入文章缓存失败",e);
            }
        }

        Long viewCount = stringRedisTemplate.opsForValue().increment(viewCountKey);

        String authorName = userService.getUserNameById(article.getAuthorId());

        //获取点赞数
        // 【修改这里】：废弃 opsForValue 计数，直接拿 Set 人数（真实点赞数，防丢）
        String likeKey = "article:likes:" + id;
        Long likeCount = stringRedisTemplate.opsForSet().size(likeKey);
        if (likeCount == null || likeCount == 0) {
            // 如果你的 Article 表里有 likeCount 字段就在这里 get 一下兜底，如果没有填 0L 即可
            likeCount = article.getLikeCount() != null ? article.getLikeCount().longValue() : 0L;
        }

        //组装VO
        ArticleVO vo = new ArticleVO();
        BeanUtils.copyProperties(article, vo);
        vo.setViewCount(viewCount);
        vo.setAuthorName(authorName);
        //点赞数
        vo.setLikeCount(likeCount);
         // [新增] 收藏数（防空指针处理）
        vo.setCollectCount(article.getCollectCount() != null ? article.getCollectCount() : 0);
        //判断当前用户是否已点赞
        if(StpUtil.isLogin()){
            Long currentUserId = StpUtil.getLoginIdAsLong();

            // ============== [新增] 记录用户浏览历史到 Redis ZSET ==============
            try {
                String historyKey = "user:history:" + currentUserId;
                String articleIdStr = id.toString();
                long currentTime = System.currentTimeMillis();
                
                // 1. ZADD：将文章ID作为元素加入ZSET，分数为当前时间戳（重复看同一篇会自动覆盖时间并置顶）
                stringRedisTemplate.opsForZSet().add(historyKey, articleIdStr, currentTime);
                
                // 2. 避免历史记录无限膨胀，保留最近的 100 条即可（0 到 -101 代表删除从最老到倒数第101名之间的那些数据）
                stringRedisTemplate.opsForZSet().removeRange(historyKey, 0, -101);
            } catch (Exception e) {
                log.error("记录浏览历史失败", e);
            }
            // ================================================================

            // 【修改这里】不再重复定义 likeKey，直接复用上方的 likeKey 变量
            Boolean isMember = stringRedisTemplate.opsForSet().isMember(likeKey, currentUserId.toString());
            vo.setLiked(Boolean.TRUE.equals(isMember));
            // [新增] 判断当前用户是否已收藏该文章
            boolean isFavorited = userFavoriteRepository.existsByUserIdAndArticleId(currentUserId, id);
            vo.setCollected(isFavorited);
        }else{
            vo.setLiked(null);
            // [新增] 未登录时设为 null
            vo.setCollected(null); 
        }
        return vo;
    }

    public LikeResult toggleLike(Long articleId){
        //第一步：获取当前用户ID
        Long userId = StpUtil.getLoginIdAsLong();
        String userIdStr = String.valueOf(userId);
        //第二步：Redis key设计
        String likeKey = "article:likes:" + articleId;
        //添加日志输出

        //第三步：判断用户是否已经点赞
        Boolean isMember = stringRedisTemplate.opsForSet().isMember(likeKey,userIdStr);
        boolean liked = Boolean.TRUE.equals(isMember);//避免NULL

        if(liked){
            //已点赞->取消点赞
            stringRedisTemplate.opsForSet().remove(likeKey,userIdStr);
            // 【修改这里】：废弃 opsForValue 计数，直接拿 Set 人数（真实点赞数，防丢）
            // stringRedisTemplate.opsForValue().decrement(likeCountKey);
        }else{
            //未点赞->执行点赞
            stringRedisTemplate.opsForSet().add(likeKey,userIdStr);

            //发布点赞通知
            publishLikeNotification(userId, articleId);
        }
        // 【修改最后两行】：直接通过取 Set 大小返回给前端最新赞数
        Long count = stringRedisTemplate.opsForSet().size(likeKey);
        Long finalLikeCount = count == null ? 0L : count;
        return new LikeResult(!liked, finalLikeCount);
    }

    public List<Article> getArticleFeed(Long cursor,int size){
        log.info("getArticleFeed被调用, cursor: {}, size: {}", cursor, size);
        Pageable limit = PageRequest.of(0,size);

        List<Article> result;

        if(cursor == null || cursor == 0L){
            result = articleRepository.findByStatusOrderByIdDesc(1, limit);
        }else{
            System.out.println("执行游标查询:findByIdLessThanAndStatusOrderByIdDesc, cursor: " + cursor);
            //加载更多：获取ID小于游标cursor的文章，按ID倒序排列，限制条数为size
            return articleRepository.findByIdLessThanAndStatusOrderByIdDesc(cursor, 1, limit);
        }
        log.info("查询到{}篇文章", result.size());
        return result;
    }

    public List<ArticleDoc> searchArticles(String keyword){
        if(!StringUtils.hasText(keyword)){
            return Collections.emptyList();
        }
        try {
            return articleSearchRepository.findBySearchKeyword(keyword);
        } catch (Exception e) {
            log.error("Elasticsearch 搜索失败, 关键字: {}", keyword, e);
            return Collections.emptyList();
        }

    }

    @Transactional
    public void deleteArticle(Long articleId) {

    // 1. 检查文章是否存在
    Article article = articleRepository.findById(articleId)
            .orElseThrow(() -> new RuntimeException("文章不存在"));
        // 核心安全拦截：获取当前登录用户
        long currentUserId = StpUtil.getLoginIdAsLong();
        
        // 判断1：是不是文章原来的作者？
        boolean isAuthor = article.getAuthorId().equals(currentUserId);
        // 判断2：是不是系统高管（ADMIN 角色会在 StpInterfaceImpl 中被自动查库比对）
        boolean isAdmin = StpUtil.hasRole("ADMIN");

        if (!isAuthor && !isAdmin) {
            throw new RuntimeException("操作已拒绝：您没有权限删除该文章");
        }

    // 2. 删除关联的评论（手动方式）
    commentRepository.deleteByArticleId(articleId);

    // 3. 删除文章
    articleRepository.delete(article);

    // 4. 清除 Redis 缓存
    String detailKey = "article:detail:" + articleId;
    String viewCountKey = "article:viewCount:" + articleId;
    String likeKey = "article:likes:" + articleId;
    String likeCountKey = "article:likeCount:" + articleId;

    stringRedisTemplate.delete(detailKey);
    stringRedisTemplate.delete(viewCountKey);
    stringRedisTemplate.delete(likeKey);
    stringRedisTemplate.delete(likeCountKey);

        // 4. 尝试删除 Elasticsearch 文档（同步，但捕获异常不抛出）
    try {
        articleSearchRepository.deleteById(articleId);
        log.info("Elasticsearch 文章删除成功, ID: {}", articleId);
    } catch (Exception e) {
        log.error("Elasticsearch 文章删除失败, ID: {}, 需手动补偿", articleId, e);
        // 不抛出异常，避免影响主事务提交
    }
}

    public List<ArticleListItemVO> listArticlesByIds(List<Long> ids) {
    // 从数据库获取文章列表
    List<Article> articles = articleRepository.findAllById(ids);
    // 手动排序：按传入的ids顺序
    Map<Long, Article> articleMap = articles.stream()
            .collect(Collectors.toMap(Article::getId, Function.identity()));
    return ids.stream()
            .map(articleMap::get)
            .filter(Objects::nonNull)
            // 原来是 .map(this::convertToListItemVO) 
            .map(articleConverter::toListItemVO)
            .collect(Collectors.toList());
}

    //获取我发布的文章列表
    public Page<ArticleListItemVO> getMyPublishedArticles(Long userId,int page,int size){
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<Article> articlePage = articleRepository.findByAuthorIdAndStatusOrderByIdDesc(userId, 1, pageable);

        // 转换为VO并返回
        return articlePage.map(articleConverter::toListItemVO);
    }

        //获取我点赞过的文章列表（Redis Set 倒排）
    public Page<ArticleListItemVO> getMyLikedArticles(Long userId,int page, int size){
        //由于目前的点赞记录保存在article:likes:{articleId}这个以文章作为主键的结构里
        //但幸好Redis支持Keys命令，为了轻量可用scan/keys

        //扫出所有点赞的key
        Set<String> keys = stringRedisTemplate.keys("article:likes:*");
        List<Long> likedArticleIds = new ArrayList<>();

        if (keys != null && !keys.isEmpty()) {
            for(String key : keys){
                //检查这个key的Set中是否包含当前用户ID
                if(Boolean.TRUE.equals(stringRedisTemplate.opsForSet().isMember(key, userId.toString()))){
                    String[] parts = key.split(":");
                    try{
                        likedArticleIds.add(Long.parseLong(parts[2]));
                    }catch(Exception ignored){
                        log.error("解析点赞文章ID失败, key: {}", key, ignored);
                    }
                }
            }
        }
        
        // 【注意！】这部分代码移出了if判断块，作为统一的逻辑或空判断返回
        // 如果没有点赞记录，直接返回空
        if (likedArticleIds.isEmpty()) {
            return Page.empty(PageRequest.of(page - 1, size));
        }

        // 把 ID 排序，最新的排在前面 (假设 ID 即生成顺序)
        likedArticleIds.sort(Collections.reverseOrder());

        // 手动进行内存分页
        int start = (page - 1) * size;
        int end = Math.min(start + size, likedArticleIds.size());
        
        if (start >= likedArticleIds.size()) {
            return Page.empty(PageRequest.of(page - 1, size));
        }

        List<Long> pagedIds = likedArticleIds.subList(start, end);
        
        // 复用已有的通过 IDs 拉取文章详情并转换序列的方法
        List<ArticleListItemVO> pagedArticles = listArticlesByIds(pagedIds);

        return new org.springframework.data.domain.PageImpl<>(pagedArticles, PageRequest.of(page - 1, size), likedArticleIds.size());
    }

    //获取我的阅读历史
    public Page<ArticleListItemVO> getMyHistory(Long userId, int page, int size) {
        String historyKey = "user:history:" + userId;
        
        long start = (long) (page - 1) * size;
        long end = start + size - 1;

        // 使用 reverseRange 获取分数最大（时间最新）的记录，这就是“近期浏览倒排”
        Set<String> articleIdStrs = stringRedisTemplate.opsForZSet().reverseRange(historyKey, start, end);
        
        if (articleIdStrs == null || articleIdStrs.isEmpty()) {
            return Page.empty(PageRequest.of(page - 1, size));
        }

        List<Long> articleIds = new ArrayList<>();
        for (String idStr : articleIdStrs) {
            try {
                articleIds.add(Long.parseLong(idStr));
            } catch (Exception e) {
                log.error("历史记录ID解析失败: {}", idStr, e);
            }
        }

        // 完美复用我们以前写好的批量抓取列表的方法！（自带过滤被删除的文章，并且严格遵循 ZSET 的顺序）
        List<ArticleListItemVO> pagedArticles = listArticlesByIds(articleIds);
        
        Long total = stringRedisTemplate.opsForZSet().zCard(historyKey);
        if (total == null) {
            total = 0L;
        }

        return new org.springframework.data.domain.PageImpl<>(pagedArticles, PageRequest.of(page - 1, size), total);
    }

    //抽离出来的私有方法，用于发布点赞通知
    private void publishLikeNotification(Long senderId,Long articleId){
    //使用ifPresent防治空指针，如果文章不存在则不发送通知
            articleRepository.findById(articleId).ifPresent(article -> {
            Notification notification = new Notification();
            notification.setSenderId(senderId);
            notification.setReceiverId(article.getAuthorId());
            notification.setType(1); // 1 代表点赞
            notification.setTargetId(articleId);
            notification.setContent("点赞了你的文章");
            
            eventPublisher.publishEvent(new NotificationEvent(this, notification));
        });
    }

    // ==================【新增一：保存或修改草稿】==================
    @Transactional
    public Long saveDraft(org.studyplant.mystudyplant.dto.ArticleUpdateRequest request) {
        Long authorId = cn.dev33.satoken.stp.StpUtil.getLoginIdAsLong();
        Article draft;
        
        // 如果有ID，代表是修改现有的草稿
        if (request.getId() != null) {
            draft = articleRepository.findById(request.getId())
                    .orElseThrow(() -> new RuntimeException("找不到您要修改的草稿"));
            if (!draft.getAuthorId().equals(authorId)) {
                throw new RuntimeException("操作已拒绝：您只能修改自己的草稿");
            }
            draft.setTitle(request.getTitle() != null ? request.getTitle() : "无标题草稿");
            draft.setContent(request.getContent() != null ? request.getContent() : "");
            draft.setImageUrl(request.getImageUrl());
            draft.setCategoryId(request.getCategoryId());
            draft.setUpdateTime(LocalDateTime.now());
        } else {
            // 没有ID，创建全新草稿
            draft = new Article();
            draft.setAuthorId(authorId);
            draft.setTitle(request.getTitle() != null ? request.getTitle() : "无标题草稿");
            draft.setContent(request.getContent() != null ? request.getContent() : "");
            draft.setImageUrl(request.getImageUrl());
            draft.setCategoryId(request.getCategoryId());
            draft.setCreateTime(LocalDateTime.now());
            draft.setUpdateTime(LocalDateTime.now());
        }
        
        draft.setStatus(0); // 强制打上草稿(0)烙印，不进入主流推荐池
        
        // 保存入库
        Article saved = articleRepository.save(draft);
        return saved.getId(); // 把新生或维持的库主键抛出去交给前端记录
    }

    // ==================【新增三：专门供前端看我的草稿箱的方法】==================
    public Page<ArticleListItemVO> getMyDrafts(Long userId, int page, int size){
        Pageable pageable = PageRequest.of(page - 1, size);
        // 通过 0 强行只把该作者被隔离的草稿掏出来
        Page<Article> articlePage = articleRepository.findByAuthorIdAndStatusOrderByIdDesc(userId, 0, pageable);

        return articlePage.map(articleConverter::toListItemVO);
    }
}
