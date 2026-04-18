package org.studyplant.mystudyplant.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "notification")
@Data
@NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 给谁发的通知（消息接收者），也就是文章/评论的作者
    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;
    
    // 谁产生的这个动作（触发者，如点赞的人），系统通知可为0
    @Column(name = "sender_id", nullable = false)
    private Long senderId;
    
    // 通知类型，例如：1-点赞，2-评论，3-系统消息 (也可以用 Enum)
    @Column(name = "type", nullable = false)
    private Integer type;
    
    // 发生互动的对象的 ID（例如点赞，这就是 articleId；如果是评论，这就是 commentId）
    @Column(name = "target_id", nullable = false)
    private Long targetId;
    
    // 一些附加内容（比如评论的具体截取文字，方便前端直接展示不用再去联查文章表）
    @Column(name = "content")
    private String content;

    // 是否已读：0-未读，1-已读
    @Column(name = "is_read", nullable = false, columnDefinition = "int default 0")
    private Integer isRead = 0;

    @Column(name = "comment_id")
    private Long commentId; // 产生此条通知的具体评论ID

    
    // 创建时间
    private LocalDateTime createTime = LocalDateTime.now();

}