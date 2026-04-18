
package org.studyplant.mystudyplant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.studyplant.mystudyplant.dto.CollectResult;
import org.studyplant.mystudyplant.entity.Article;
import org.studyplant.mystudyplant.entity.Notification;
import org.studyplant.mystudyplant.entity.UserFavorite;
import org.studyplant.mystudyplant.event.NotificationEvent;
import org.studyplant.mystudyplant.repository.ArticleRepository;
import org.studyplant.mystudyplant.repository.UserFavoriteRepository;
import org.studyplant.mystudyplant.vo.ArticleListItemVO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final UserFavoriteRepository favoriteRepository;
    private final ArticleRepository articleRepository;
    private final ArticleService articleService; // 用于转换VO
    private final ApplicationEventPublisher eventPublisher; // 用于发布收藏事件
    private final StringRedisTemplate stringRedisTemplate; // 用于操作 Redis

  
    /**
     * 切换文章的收藏状态（如果已收藏则取消，如果未收藏则收藏）
     * 
     * @param userId    用ID
     * @param articleId 文章ID
     * @return CollectResult 包含最新的收藏状态以及最新数量
     */
    @Transactional
    public CollectResult toggleFavorite(Long userId, Long articleId) {
        // 1. 检查文章是否存在，如果不存在直接抛出异常
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new RuntimeException("文章不存在"));

        // 2. 检查用户是否已经收藏了该文章
        boolean isFavorited = favoriteRepository.existsByUserIdAndArticleId(userId, articleId);

        boolean currentStatus;
        int currentCount = article.getCollectCount() != null ? article.getCollectCount() : 0;

        if (isFavorited) {
            // 已收藏 -> 执行取消收藏
            favoriteRepository.deleteByUserIdAndArticleId(userId, articleId);
            currentCount = Math.max(0, currentCount - 1);
            currentStatus = false;
        } else {
            // 未收藏 -> 执行收藏
            UserFavorite favorite = new UserFavorite();
            favorite.setUserId(userId);
            favorite.setArticleId(articleId);
            favorite.setCreatedTime(LocalDateTime.now()); // 确保填入时间防止数据库约束报错
            favoriteRepository.save(favorite);
            
            currentCount += 1;
            currentStatus = true;

            //发布收藏通知
            publishFavoriteNotification(userId, article);
        }

        // 3. 将最新的计数保存回 Article 中的冗余字段
        article.setCollectCount(currentCount);
        articleRepository.save(article);

        // 【新增】：主动踢掉文章详情缓存，逼迫下一次刷新必须查最新库！
        stringRedisTemplate.delete("article:detail:" + articleId);
        // 4. 封装结果返回给前端
        return new CollectResult(currentStatus, currentCount);
    }

    /**
     * 分页获取用户收藏的文章列表
     * @param userId 用户ID
     * @param pageNum 页码（从1开始）
     * @param pageSize 每页大小
     * @return 分页结果，包含文章VO和总数
     */
    public Page<ArticleListItemVO> getUserFavorites(Long userId, int pageNum, int pageSize) {
        Pageable pageable = PageRequest.of(pageNum - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdTime"));
        Page<UserFavorite> favoritePage = favoriteRepository.findByUserIdOrderByCreatedTimeDesc(userId, pageable);

        // 提取文章ID列表
        List<Long> articleIds = favoritePage.getContent().stream()
                .map(UserFavorite::getArticleId)
                .collect(Collectors.toList());

        // 批量查询文章详情并转换为VO（注意保持顺序与favoritePage一致）
        List<ArticleListItemVO> vos = articleService.listArticlesByIds(articleIds); // 需要实现按传入ID顺序返回

        // 重新封装为Page对象（因为VO列表可能与favoritePage顺序一致，但需要小心）
        return new PageImpl<>(vos, pageable, favoritePage.getTotalElements());
    }

    /**
     * 获取用户收藏总数
     */
    public long getFavoriteCount(Long userId) {
        return favoriteRepository.countByUserId(userId);
    }

    /**
     * 检查用户是否已收藏某文章
     */
    public boolean isFavorited(Long userId, Long articleId) {
        return favoriteRepository.existsByUserIdAndArticleId(userId, articleId);
    }

    private void publishFavoriteNotification(Long senderId,Article article){
                // 由于上面传入了完整的 Article，这里不需要再查库，直接获取作者即可
        Notification notification = new Notification();
        notification.setSenderId(senderId);
        notification.setReceiverId(article.getAuthorId());
        notification.setType(3); // 约定：3代码收藏通知
        notification.setTargetId(article.getId());
        notification.setContent("收藏了你的文章");
        
        eventPublisher.publishEvent(new NotificationEvent(this, notification));
    }
}