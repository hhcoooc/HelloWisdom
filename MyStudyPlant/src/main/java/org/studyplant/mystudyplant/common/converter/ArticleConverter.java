package org.studyplant.mystudyplant.common.converter;

import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.studyplant.mystudyplant.entity.Article;
import org.studyplant.mystudyplant.service.UserService;
import org.studyplant.mystudyplant.vo.ArticleListItemVO;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ArticleConverter {

    private final UserService userService;
    private final StringRedisTemplate stringRedisTemplate;

    /**
     * 将 Article 实体转换为 ArticleListItemVO
     */
    public ArticleListItemVO toListItemVO(Article article) {
        if (article == null) {
            return null;
        }

        ArticleListItemVO vo = new ArticleListItemVO();
        BeanUtils.copyProperties(article, vo);

        // 生成摘要
        if (article.getContent() != null) {
            String content = article.getContent();
            String summary = content.length() > 100 ? content.substring(0, 100) + "..." : content;
            vo.setSummary(summary);
        }

        // 获取作者名称
        String authorName = userService.getUserNameById(article.getAuthorId());
        vo.setAuthorName(authorName);
        // =======================
        // 增加回退机制 (Fallback)
        // =======================

        // 1. 获取浏览量：优先 Redis，拿不到就回退数据库数值
        String viewCountKey = "article:viewCount:" + article.getId();
        String viewCountStr = stringRedisTemplate.opsForValue().get(viewCountKey);
        if (viewCountStr != null) {
            vo.setViewCount(Long.parseLong(viewCountStr));
        } else {
            vo.setViewCount(article.getViewCount() != null ? article.getViewCount().longValue() : 0L);
        }

        // 2. 获取点赞数：优先用 Redis 的 Set 人头数，拿不到就回退数据库数值
        // 因为咱们前两天已经把点赞改成了以 Set(article:likes:{id}) 为尊
        String likeSetKey = "article:likes:" + article.getId();
        Long redisLikeCount = stringRedisTemplate.opsForSet().size(likeSetKey);
        
        if (redisLikeCount != null && redisLikeCount > 0) {
            vo.setLikeCount(redisLikeCount);
        } else {
            // 如果 Redis 获取不到（比如过期或服务重启），拿数据库兜底数值
            vo.setLikeCount(article.getLikeCount() != null ? article.getLikeCount().longValue() : 0L);
        }
        return vo;
    }
}