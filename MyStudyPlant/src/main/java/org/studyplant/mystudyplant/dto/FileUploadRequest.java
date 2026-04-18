package org.studyplant.mystudyplant.dto;

import java.io.File;

import org.studyplant.mystudyplant.common.constant.FileCategory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data

public class FileUploadRequest {
    
    @NotNull(message = "文件分类不能为空")
    private FileCategory category; //直接使用枚举类型接收

    private String imageUrl; //封面图片URL

    //未来可以添加更多字段，如文件描述、标签等
}
