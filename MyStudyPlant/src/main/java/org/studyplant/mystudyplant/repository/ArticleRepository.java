package org.studyplant.mystudyplant.repository;


import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.studyplant.mystudyplant.entity.Article;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    @Modifying(clearAutomatically = true,flushAutomatically = true)
    @Query("update Article a set a.viewCount = a.viewCount + :view where a.id = :id")
    @Transactional
    int incrementViewCount(@Param("id") Long id,@Param("view") Integer views);

    @Modifying(clearAutomatically = true,flushAutomatically = true)
    @Query("update Article a set a.likeCount = a.likeCount + :like where a.id = :id")
    @Transactional
    int incrementLikeCount(@Param("id") Long id,@Param("like") Integer likes);

    // 查询 ID 小于游标的“已发布”文章，按 ID 倒序
    List<Article> findByIdLessThanAndStatusOrderByIdDesc(Long id, Integer status, Pageable pageable);

    // 用于第一次请求（没有游标时），查询最新的“已发布”文章
    List<Article> findByStatusOrderByIdDesc(Integer status, Pageable pageable);

    Page<Article> findByCategoryIdAndStatus(Long categoryId, Integer status, Pageable pageable);

    Page<Article> findByCategoryId(Long categoryId,Pageable pageable);

    List<Article> findByCategoryIdAndStatusOrderByIdDesc(Long categoryId, Integer status, Pageable pageable);

    List<Article> findByIdLessThanAndCategoryIdAndStatusOrderByIdDesc(Long cursorId, Long categoryId, Integer status, Pageable pageable);

    @Modifying
    @Query("update Article a set a.collectCount = a.collectCount + :delta where a.id = :id and a.collectCount + :delta >= 0")
    int incrementCollectCount(@Param("id") Long id, @Param("delta") int delta);

    // 在 ArticleRepository 接口中新增：
    Page<Article> findByAuthorIdOrderByIdDesc(Long authorId, Pageable pageable);

    Page<Article> findByAuthorIdAndStatusOrderByIdDesc(Long authorId, Integer status, Pageable pageable);

    // ================= [新增 SEO Sitemap 专用轻量级查询] =================
    @Query("SELECT new org.studyplant.mystudyplant.vo.ArticleSitemapVO(a.id, a.updateTime) FROM Article a ORDER BY a.id DESC")
    List<org.studyplant.mystudyplant.vo.ArticleSitemapVO> findAllForSitemap();

      // ================= [新增 Admin 后台管理专用查询] =================
    // 模糊搜索分类（配合在 Controller 里设置好 Sort 排序即可）
    Page<Article> findByTitleContainingOrContentContaining(String title, String content, Pageable pageable);
}