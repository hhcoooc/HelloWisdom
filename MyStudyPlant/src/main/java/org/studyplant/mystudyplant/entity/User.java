package org.studyplant.mystudyplant.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;


@NoArgsConstructor
@Entity
@Table(name = "sys_user")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String password;
    private String email;

    @Column(name = "avatar")
    private String avatar;

    @Column(name = "status")
    private Integer status; // 0=封禁, 1=正常

    @Column(name = "create_time")
    private java.time.LocalDateTime createTime;
    
    
}
