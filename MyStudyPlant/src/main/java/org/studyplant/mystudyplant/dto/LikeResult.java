package org.studyplant.mystudyplant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data 
@AllArgsConstructor

public class LikeResult {
    private Boolean liked; // 是否已点赞
    private Long likeCount; // 当前点赞数
}
