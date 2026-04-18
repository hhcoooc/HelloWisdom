package org.studyplant.mystudyplant.repository;

import java.util.List;

import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.repository.query.Param;
import org.studyplant.mystudyplant.document.ArticleDoc;

public interface ArticleSearchRepository extends ElasticsearchRepository<ArticleDoc,Long>{

    // 废弃之前的原名推导，自己写复合查询：
    // bool.should 表示“只要满足下面四个条件中任意一个即可命中”
    // match: 利用 IK 智能分词匹配核心词。
    // wildcard: '*' + 关键词 + '*'，强行进行类似 MySQL LIKE 的半截字兜底匹配！
    @Query("{\"bool\": {\"should\": [" +
            "{\"match\": {\"title\": \"?0\"}}, " +
            "{\"match\": {\"content\": \"?0\"}}, " +
            "{\"wildcard\": {\"title\": \"*?0*\"}}, " +
            "{\"wildcard\": {\"content\": \"*?0*\"}}" +
            "]}}")
    List<ArticleDoc> findBySearchKeyword(String keyword);
}
