package org.studyplant.mystudyplant.vo;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class AdminUserVO {
    private Long id;
    private String username;
    private String email;
    private Integer status;
    private LocalDateTime createTime;
}
