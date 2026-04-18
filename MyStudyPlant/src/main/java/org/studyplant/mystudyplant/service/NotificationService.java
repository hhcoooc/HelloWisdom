package org.studyplant.mystudyplant.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.studyplant.mystudyplant.entity.Notification;
import org.studyplant.mystudyplant.repository.NotificationRepository;
import org.studyplant.mystudyplant.vo.NotificationVO;

import cn.dev33.satoken.stp.StpUtil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserService userService; // 我们需要借用它来找用户名

    /**
     * 1. 获取当前用户的未读消息总数
     */
    public long getUnreadCount() {
        Long currentUserId = StpUtil.getLoginIdAsLong();
        return notificationRepository.countByReceiverIdAndIsRead(currentUserId, 0);
    }

    /**
     * 2. 标记当前用户的所有消息为已读
     */
    public void markAllAsRead() {
        Long currentUserId = StpUtil.getLoginIdAsLong();
        notificationRepository.markAllAsReadByReceiverId(currentUserId);
    }

    /**
     * 3. 分页拉取我的消息列表，并且封装返回 (包含发起者的名字)
     */
    public Page<NotificationVO> getMyNotifications(int page, int size) {
        Long currentUserId = StpUtil.getLoginIdAsLong();
        Pageable pageable = PageRequest.of(page - 1, size);
        
        // 从数据库分页查询这个人的所有通知 (按时间倒序)
        Page<Notification> notificationPage = notificationRepository.findByReceiverIdOrderByCreateTimeDesc(currentUserId, pageable);

        // 实体转成对前端友好的 VO (附加上发送者的昵称)
        return notificationPage.map(notification -> {
            NotificationVO vo = new NotificationVO();
            vo.setId(notification.getId());
            vo.setSenderId(notification.getSenderId());
            vo.setType(notification.getType());
            vo.setTargetId(notification.getTargetId());
            vo.setContent(notification.getContent());
            vo.setIsRead(notification.getIsRead());
            vo.setCreateTime(notification.getCreateTime());
            vo.setCommentId(notification.getCommentId());

            // 查询发送者昵称。如果是系统消息 (senderId == 0), 则显示"系统"
            if (notification.getSenderId() != null && notification.getSenderId() > 0) {
                vo.setSenderName(userService.getUserNameById(notification.getSenderId()));
            } else {
                vo.setSenderName("系统通知");
            }
            return vo;
        });
    }
}