package org.studyplant.mystudyplant.vo;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ArticleVO {
    private Long id;//文章Id
    private String title;
    private String content;
    private String imageUrl;
     private String summary; // 【新增这一行】：单篇文章请求也会下发摘要供 SSR 的 Meta 标签使用
    private Long categoryId;
    private Long authorId;//作者Id
    private String authorName;//作者名字
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Long viewCount;//浏览量
    private Long likeCount;//点赞数
     private Boolean liked; // true:已点赞, false:未点赞, null:未登录
     // 添加这两个字段
    private Integer collectCount; // 收藏数
    private Boolean collected;    // true:已收藏, false:未收藏, null:未登录

}
