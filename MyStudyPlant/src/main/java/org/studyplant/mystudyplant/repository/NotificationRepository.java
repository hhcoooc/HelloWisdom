package org.studyplant.mystudyplant.repository;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.studyplant.mystudyplant.entity.Notification;
import org.springframework.data.repository.query.Param;
import jakarta.transaction.Transactional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    //统计某人共有多少条未读消息
long countByReceiverIdAndIsRead(Long receiverId, Integer isRead);

    //分页获取某人的消息流(可以配合下拉刷新)，默认按照 createTime 倒序
    Page<Notification> findByReceiverIdOrderByCreateTimeDesc(Long receiverId, Pageable pageable);

    //批量标记为已读
    @Modifying
    @Transactional
    @Query("update Notification n set n.isRead = 1 where n.receiverId = :receiverId and n.isRead = 0")
    int markAllAsReadByReceiverId(@Param("receiverId") Long receiverId);
    
}
