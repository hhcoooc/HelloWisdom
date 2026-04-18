package org.studyplant.mystudyplant.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "knowledge_node")
public class KnowledgeNode {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //外键关联KnowledgeBase.id，表示这个知识点属于哪个知识库
    private Long kbId;
    //父节点ID，根节点的parentId为0或null
    private Long parentId;
    //章节或文章标题
    private String title;
    //关联的Article ID，纯文件夹节点这个字段为null
    private Long articleId;
    //排序字段，同一层级的节点按照这个字段升序排列
    private Integer sortOrder;
}
