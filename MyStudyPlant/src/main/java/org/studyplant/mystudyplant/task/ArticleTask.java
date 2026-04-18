package org.studyplant.mystudyplant.task;

import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.studyplant.mystudyplant.repository.ArticleRepository;

@Component
public class ArticleTask {
    private static final Logger log = LoggerFactory.getLogger(ArticleTask.class);
    private static final String VIEW_COUNT_KEY_PREFIX = "article:viewCount:";

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @SuppressWarnings("deprecation")
    private Set<String> scanKeys(String pattern){
        //类内部添加scanKeys方法，使用scan命令替代keys命令
        Set<String> keys = new HashSet<>();
        stringRedisTemplate.execute((RedisCallback<Object>) connection -> {
            ScanOptions options = ScanOptions.scanOptions()
                    .match(pattern)
                    .count(100)//每次扫描100个key
                    .build();
            try(Cursor<byte[]> cursor = connection.scan(options)){
                while(cursor.hasNext()){
                    keys.add(new String(cursor.next()));
                    }
                } catch (Exception e) {
                // TODO: handle exception
                log.error("SCAN keys失败,pattern:{}",pattern,e);
            }
            return null;

        });
        return keys;
    }

    @Scheduled(cron = "0 0/1 * * * ?")//每分钟执行一次
    public void syncArticleViewCount(){
    /**
     * 每分钟执行一次，同步 Redis 中的文章浏览量到数据库
     * 注意：使用 keys 命令（仅用于测试环境，生产环境请改用 scan）
     */

        log.info("开始同步文章浏览量...");
        //第一步：获取所有文章浏览量的 Redis 键
        Set<String> keys = scanKeys(VIEW_COUNT_KEY_PREFIX + "*");
        if(keys == null || keys.isEmpty()){
            log.info("没有需要同步的文章浏览量");
            return;
        }

        int successCount = 0;

        for(String key : keys){
            try {
                //第二步:从key中提取文章ID（格式：article:viewCount:articleId）
                String idStr = key.substring(VIEW_COUNT_KEY_PREFIX.length());
                Long articleId = Long.parseLong(idStr);

                //第三步：获取当前浏览量数值（递增后的值）
                String viewStr = stringRedisTemplate.opsForValue().get(key);
                if(viewStr == null){
                    continue;
                }
                int views = Integer.parseInt(viewStr);

                //第四步：调用Repository增量更新到数据库
                int updateRows = articleRepository.incrementViewCount(articleId,views);
                if(updateRows > 0){
                    log.debug("成功同步文章ID={}的浏览量，增量={}",articleId,views);
                } else {
                    log.warn("文章{}不存在,但Redis中有其浏览量数据,已清理",articleId);
                }

                //第五步：无论文章是否存在，都删除Redis key
                stringRedisTemplate.delete(key);
                successCount++;
            } catch (NumberFormatException e) {
               log.error("解析文章ID失败,key:{}",key,e);
            }catch(Exception e){
                log.error("同步文章浏览量失败,key:{}",key,e);
                //发生异常不删除key,以便下次重试
            }
        }

        log.info("浏览量同步完成,共处理{}个key",successCount);


    }
    
    @Scheduled(cron = "0 0/1 * * * ?")
    public void syncArticleLikeCount(){
    /**
     * 每分钟执行一次，同步 Redis 中的文章点赞量到数据库
     * 注意：使用 keys 命令（仅用于测试环境，生产环境请改用 scan）
     */
        log.info("开始同步文章点赞量...");
    //第一步：获取所有文章点赞量的 Redis 键
        Set<String> keys = scanKeys("article:likeCount:*");
        if(keys == null || keys.isEmpty()){
            log.info("没有需要同步的文章点赞量");
            return;
        }
        int successCount = 0;
        for(String key : keys){
            try {
                String idStr = key.substring("article:likeCount:".length());
                Long articleId = Long.parseLong(idStr);
                //获取当前点赞量数值
                String likeStr = stringRedisTemplate.opsForValue().get(key);
                if(likeStr == null){
                    continue;
                }
                int likes = Integer.parseInt(likeStr);
                //调用Repository增量更新到数据库
                int updateRows = articleRepository.incrementLikeCount(articleId,likes);
                if(updateRows > 0){
                    log.debug("成功同步文章ID={}的点赞量，增量={}",articleId,likes);
                } else {
                    log.warn("文章{}不存在,但Redis中有其点赞量数据,已清理",articleId);
                }
                //无论文章是否存在，都删除Redis key
                stringRedisTemplate.delete(key);
                successCount++;
            } catch (Exception e) {
                log.error("同步文章点赞量失败,key:{}",key,e);
                //发生异常不删除key,以便下次重试
            }

        }
        log.info("点赞量同步完成,共处理{}个key",successCount);
    


    }

}
