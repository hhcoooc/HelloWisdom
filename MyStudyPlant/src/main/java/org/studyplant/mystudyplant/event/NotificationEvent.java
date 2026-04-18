package org.studyplant.mystudyplant.event;


import org.springframework.context.ApplicationEvent;
import org.studyplant.mystudyplant.entity.Notification;

import lombok.Getter;

@Getter
public class NotificationEvent extends ApplicationEvent {
    
    //核心信息就是要存库的Notification对象
    private final Notification notification;

    public NotificationEvent(Object source, Notification notification) {
        super(source);
        this.notification = notification;
    }
}
