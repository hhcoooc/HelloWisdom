package org.studyplant.mystudyplant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data

public class CommentPublishRequest {
    @NotNull(message = "文章ID不能为空")
    private Long articleId;

    @NotBlank(message = "评论内容不能为空")
    private String content; //评论内容

    private Long parentId = 0L; //父评论ID，可选(默认为0)

    private String imageUrl; // 新增，评论图片URL

    /**
     * 楼中楼回复时，被回复用户的用户名（由前端判断并传入）
     */
    private String targetUserName; 
    
    
}
