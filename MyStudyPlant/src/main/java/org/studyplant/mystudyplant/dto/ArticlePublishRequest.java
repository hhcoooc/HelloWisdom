package org.studyplant.mystudyplant.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ArticlePublishRequest {
    @NotBlank(message = "文章标题不能为空")
    private String title;

    @NotNull(message = "文章内容不能为空")
    private String content;


    private String imageUrl; //封面图片URL

    @Min(value = 1, message = "分类ID必须大于0")
    private Long categoryId; //文章分类ID，未来可以扩展为多个分类
}
