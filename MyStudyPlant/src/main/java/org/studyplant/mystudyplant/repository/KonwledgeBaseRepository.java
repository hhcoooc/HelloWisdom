package org.studyplant.mystudyplant.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.studyplant.mystudyplant.entity.KnowledgeBase;

@Repository
public interface KonwledgeBaseRepository extends JpaRepository<KnowledgeBase, Long> {
    // 增加获取我的知识库方法
    List<KnowledgeBase> findByAuthorIdOrderByIdDesc(Long authorId);
}
