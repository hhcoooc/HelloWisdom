package org.studyplant.mystudyplant.vo;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class NotificationVO {
    private Long id;
    private Long senderId;
    private String senderName; // 额外查出来的发起者昵称，比如 "小明"
    private Integer type;      // 1-点赞, 2-评论, 3-系统
    private Long targetId;     // 文章/评论的ID，前端点这个通知可以直接跳归对应的文章
    private Long commentId;    // 如果是评论通知，这里会包含具体的评论ID
    private String content;
    private Integer isRead;    // 0-未读, 1-已读
    private LocalDateTime createTime;
}
