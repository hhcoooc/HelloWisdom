package org.studyplant.mystudyplant.event;

import lombok.Getter;
import org.springframework.boot.actuate.autoconfigure.wavefront.WavefrontProperties.Application;
import org.springframework.context.ApplicationEvent;



@Getter
public class ArticlePublishedEvent extends ApplicationEvent {
    private final Long articleId;

    public ArticlePublishedEvent(Object source, Long articleId) {
        super(source);
        this.articleId = articleId;
    }
}
