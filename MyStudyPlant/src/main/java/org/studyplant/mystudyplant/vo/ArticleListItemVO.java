package org.studyplant.mystudyplant.vo;

import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.Data;

@Data
public class ArticleListItemVO {
    private Long id;
    private String title;
    private String imageUrl;
    private String summary;
    private Long authorId;
    private String authorName;
    private LocalDateTime createTime;
    private Long viewCount;
    private Long likeCount;
}
