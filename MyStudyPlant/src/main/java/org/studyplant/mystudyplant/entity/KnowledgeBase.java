package org.studyplant.mystudyplant.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "knowledge_base")
public class KnowledgeBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    //专栏名称
    private String title;
    //专栏简介
    private String description;
    //专栏封面图片URL
    private String coverUrl;
    //专栏作者ID，关联用户表
    private Long authorId;
}
