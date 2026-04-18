package org.studyplant.mystudyplant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data

public class FileUploadResult {
    private final String url;
    private final String objectName;

    public FileUploadResult(String url,String objectName){
        this.url = url;
        this.objectName = objectName;
    }
}
