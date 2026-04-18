package org.studyplant.mystudyplant.vo;

import lombok.Data;

@Data
public class KnowledgeBaseVO {
    private Long id;
    private String title;
    private String description;
    private String coverUrl;
    private Long authorId;

    // ======== 新增的展示字段 ========
    private String authorName;
    private String authorAvatar;
}
