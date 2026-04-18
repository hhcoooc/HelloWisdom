package org.studyplant.mystudyplant.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollectResult {
    private boolean collected; // 是否已收藏
    private int collectCount; // 收藏总数
}
