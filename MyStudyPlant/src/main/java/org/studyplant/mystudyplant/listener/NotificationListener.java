package org.studyplant.mystudyplant.listener;

import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.studyplant.mystudyplant.common.server.NotificationWebSocketServer;
import org.studyplant.mystudyplant.entity.Notification;
import org.studyplant.mystudyplant.event.NotificationEvent;
import org.studyplant.mystudyplant.repository.NotificationRepository;
import org.studyplant.mystudyplant.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationListener {
    private final UserService userService; // 用于查询发送者名字
    private final NotificationRepository notificationRepository;

    /**
     * 监听到消息事件后，异步执行入库动作。
     * 因为是@Async，它是在别的线程池中执行，如果发生异常，绝不阻塞原来的主事务提交。
     */
    @Async("taskExecutor") // 之前你已经在 AsyncConfig 里配置到了 taskExecutor 线程池
    @EventListener
    public void processNotification(NotificationEvent event) {
        try {
            Notification notification = event.getNotification();
            
            // 如果自己给自己点赞/评论，可以选择不发通知
            if (notification.getSenderId().equals(notification.getReceiverId())) {
                return;
            }
            
            notificationRepository.save(notification);

            // 【新增这块】查出发送者的名字，由于是异步，随便从数据库查询
            String senderName = userService.getUserNameById(notification.getSenderId());

            // 构建通知消息内容，可以根据通知类型定制不同的消息格式
            String jsonMessage = String.format("{\"type\":\"NEW_NOTIFICATION\", \"content\":\"%s\", \"senderName\":\"%s\"}", 
            notification.getContent().replace("\"", "\\\""), 
            senderName);

            // 瞄准接收者，火速推送！
            NotificationWebSocketServer.sendMessageToUser(notification.getReceiverId(), jsonMessage);

            log.info("异步通知投递成功：发送者 [{}], 接收者 [{}], 通知类型 [{}]", 
                     notification.getSenderId(), notification.getReceiverId(), notification.getType());
        } catch (Exception e) {
            log.error("处理通知事件失败", e);
        }
    }
}
