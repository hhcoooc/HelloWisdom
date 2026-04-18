package org.studyplant.mystudyplant.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.studyplant.mystudyplant.entity.UserFavorite;

import jakarta.transaction.Transactional;

public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {

    // 根据用户ID和文章ID查询是否存在收藏记录
    boolean existsByUserIdAndArticleId(Long userId, Long articleId);
    
    //删除收藏记录
    void deleteByUserIdAndArticleId(Long userId, Long articleId);

    // 根据用户ID分页查询收藏记录，按创建时间降序排序
    Page<UserFavorite> findByUserIdOrderByCreatedTimeDesc(Long userId, Pageable pageable);

    // 统计用户的收藏总数
    long countByUserId(Long userId);

    // 统计文章的收藏总数
    long countByArticleId(Long articleId);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserFavorite uf WHERE uf.articleId = :articleId")
    void deleteByArticleId(@Param("articleId") Long articleId);


}
