package org.studyplant.mystudyplant.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "comments")
@Data
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "article_id",nullable = false)
    private Long articleId;//评论所属的文章ID

    @Column(name = "author_id",nullable = false)
    private Long authorId;//评论作者的用户ID

    @Column(nullable = false,length = 2000)
    private String content;//评论内容

    @Column(name = "parent_id",nullable = false,columnDefinition = "bigint default 0")
    private Long parentId = 0L;//父评论ID，默认为0表示一级评论

    @CreationTimestamp
    @Column(name = "create_time",updatable = false)
    private LocalDateTime createTime;//评论创建时间,自动生成

    @Column(name = "image_url")
    private String imageUrl; // 新增字段

    @Column(name = "target_user_name", length = 100)
    private String targetUserName; // 被回复的用户名
}
