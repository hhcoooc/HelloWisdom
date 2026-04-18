package org.studyplant.mystudyplant.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Entity
@Data
@Table(name="article")
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "status", columnDefinition = "INT DEFAULT 1")
    private Integer status = 1; // 1=已发布，0=草稿

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    private LocalDateTime createTime = LocalDateTime.now();

    @Column(name = "view_count", nullable = false, columnDefinition = "int default 0")
    private Integer viewCount = 0;

    @Column(name = "like_count", nullable = false, columnDefinition = "int default 0")
    private Integer likeCount = 0;

    @Column(name = "image_url")
    private String imageUrl; //封面图片URL

    @Column(name = "category_id")
    private Long categoryId; //文章分类ID，未来可以扩展为多个分类

    @Column(name = "collect_count", nullable = false)
    private Integer collectCount = 0;//收藏数，冗余字段，方便查询

    // ====== [新增 SEO & Sitemap 核心字段] ======
    
    @Column(name = "summary", length = 300)
    private String summary; // 文章摘要(SEO Description)

    @Column(name = "update_time")
    private LocalDateTime updateTime; // 文章最后修改时间(Sitemap)



}
