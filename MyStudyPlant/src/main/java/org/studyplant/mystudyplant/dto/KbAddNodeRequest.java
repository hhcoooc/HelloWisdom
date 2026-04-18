package org.studyplant.mystudyplant.dto;

import lombok.Data;

@Data
public class KbAddNodeRequest {
    private Long parentId; // 上级目录 ID。0 或者空代表放在根目录
    private String title;  // 在树上显示的标题（可以冗余文章的标题）
    private Long articleId; // 具体挂载的文章 ID
}
