package org.studyplant.mystudyplant.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.studyplant.mystudyplant.entity.Comment;


public interface CommentRepository extends JpaRepository<Comment,Long>{
    
    //根据文章ID查询评论列表，按创建时间升序排序(最新的评论在前面)
    //@param articleId 文章ID
    //return 评论列表

    public List<Comment> findByArticleIdOrderByCreateTimeAsc(Long articleId);
    
    void deleteByArticleId(Long articleId);
}
