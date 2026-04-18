package org.studyplant.mystudyplant.vo;

import lombok.Data;

@Data
public class AdminStatsVO {
    private Long totalUsers;
    private Long totalArticles;
    private Long totalComments; // 可选，看你有没有相关 repository
}
