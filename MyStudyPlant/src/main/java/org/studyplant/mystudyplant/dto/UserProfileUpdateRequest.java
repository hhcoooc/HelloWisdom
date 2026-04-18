package org.studyplant.mystudyplant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    // 邮箱可以不填，所以不加 NotBlank
    private String email; 
}
