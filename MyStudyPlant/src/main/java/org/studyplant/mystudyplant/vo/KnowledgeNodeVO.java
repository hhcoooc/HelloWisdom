package org.studyplant.mystudyplant.vo;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class KnowledgeNodeVO {
    private Long id;
    private Long kbId;
    private Long parentId;
    private String title;
    private Long articleId;
    private Integer sortOrder;
    //用于给前端渲染树型折叠菜单
    private List<KnowledgeNodeVO> children = new ArrayList<>();
}
