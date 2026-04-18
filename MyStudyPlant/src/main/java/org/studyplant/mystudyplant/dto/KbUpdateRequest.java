package org.studyplant.mystudyplant.dto;

import lombok.Data;

@Data
public class KbUpdateRequest {
    private String title;
    private String description;
    private String coverUrl;
}
