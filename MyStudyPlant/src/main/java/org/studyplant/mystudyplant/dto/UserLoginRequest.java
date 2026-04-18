package org.studyplant.mystudyplant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data

public class UserLoginRequest {
    private String username;
    private String password;
}
