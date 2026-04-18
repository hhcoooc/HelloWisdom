package org.studyplant.mystudyplant.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.studyplant.mystudyplant.entity.KnowledgeNode;

@Repository
public interface KnowledgeNodeRepository extends JpaRepository<KnowledgeNode,Long> {
    //查一个专栏下的所有结点，并按sortOrder升序排列
    List<KnowledgeNode> findByKbIdOrderBySortOrderAsc(Long kbId);
}
