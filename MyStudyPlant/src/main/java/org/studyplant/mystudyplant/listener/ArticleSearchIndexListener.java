package org.studyplant.mystudyplant.listener;


import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.studyplant.mystudyplant.document.ArticleDoc;
import org.studyplant.mystudyplant.entity.Article;
import org.studyplant.mystudyplant.event.ArticlePublishedEvent;
import org.studyplant.mystudyplant.repository.ArticleRepository;
import org.studyplant.mystudyplant.repository.ArticleSearchRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class ArticleSearchIndexListener {
    
    private final ArticleRepository articleRepository;
    private final ArticleSearchRepository searchRepository;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleArticlePublished(ArticlePublishedEvent event) {
        Long articleId = event.getArticleId();
        try {
            Article article = articleRepository.findById(articleId).orElse(null);
            if (article == null) {
                log.warn("文章不存在,ID: {}", articleId);
                return;
            }
            //转换为ES文档对象
            ArticleDoc doc = new ArticleDoc();
            doc.setId(article.getId());
            doc.setTitle(article.getTitle());
            doc.setContent(article.getContent());
            // 如有其他字段需索引，请补充

            //保存到ES索引库
            searchRepository.save(doc);
            log.info("文章索引成功,ID: {}", articleId);
        } catch (Exception e) {
            log.error("文章索引失败,ID: {}", articleId, e);
        }
    }
}
