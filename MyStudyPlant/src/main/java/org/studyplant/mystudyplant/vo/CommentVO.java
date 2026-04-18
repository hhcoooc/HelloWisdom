package org.studyplant.mystudyplant.vo;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class CommentVO {
        private Long id;                // 评论ID
    private String content;         // 评论内容
    private String imageUrl;        // 评论图片URL（新增）
    private Long articleId;         // 所属文章ID
    private Long authorId;            // 评论者ID
    private Long parentId;          // 父评论ID（回复评论时使用）
    private LocalDateTime createTime; // 创建时间
    // 可选：评论者信息（如昵称、头像），如果前端需要，可以添加
    private String authorName;
    private String authorAvatar;

    private String targetUserName; // 回复评论时，目标用户的昵称

    private List<CommentVO> replies; // 回复列表
}
