package org.studyplant.mystudyplant.vo;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleSitemapVO {
    private Long id;
    private LocalDateTime updateTime;
}
