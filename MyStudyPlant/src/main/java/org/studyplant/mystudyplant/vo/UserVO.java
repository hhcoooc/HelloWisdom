package org.studyplant.mystudyplant.vo;

import lombok.Data;

@Data
public class UserVO {
    private Long id;
    private String username;
    private String email;
    private String avatar;
    // 可以随时扩展：比如后续加个 userBio(个人简介) 等
    
}
