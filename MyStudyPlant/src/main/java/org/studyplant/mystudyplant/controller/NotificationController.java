package org.studyplant.mystudyplant.controller;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.studyplant.mystudyplant.common.PageResult;
import org.studyplant.mystudyplant.common.Result;
import org.studyplant.mystudyplant.service.NotificationService;
import org.studyplant.mystudyplant.vo.NotificationVO;

import cn.dev33.satoken.annotation.SaCheckLogin;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 获取未读红点数量
    @GetMapping("/unread")
    @SaCheckLogin
    public Result<Long> getUnreadCount() {
        return Result.success("获取未读数成功", notificationService.getUnreadCount());
    }

    // 结合你之前的精简分页对象返回消息列表
    @GetMapping("/list")
    @SaCheckLogin
    public Result<PageResult<NotificationVO>> getList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<NotificationVO> resultPage = notificationService.getMyNotifications(page, size);
        return Result.success("获取通知列表成功", PageResult.of(resultPage));
    }

    // 一键已读当前用户所有消息
    @PutMapping("/read")
    @SaCheckLogin
    public Result<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return Result.success("一键已读成功");
    }
}