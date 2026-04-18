package org.studyplant.mystudyplant.task;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import io.minio.ListObjectsArgs;
import io.minio.MinioClient;
import io.minio.RemoveObjectArgs;
import io.minio.Result;
import io.minio.messages.Item;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class MinioCleanupTask {
    @Autowired
    private MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Scheduled(cron = "0 0 3 * * ?")//每天凌晨3点执行
    public void cleanTempCommentFiles(){
        log.info("开始清理临时评论图片...");
        try{
            Iterable<Result<Item>> results = minioClient.listObjects(
                ListObjectsArgs.builder()
                    .bucket(bucketName)
                    .prefix("private/comments/temp")
                    .build()    
            );
            Instant oneDayAgo = Instant.now().minus(1,ChronoUnit.DAYS);
            for(Result<Item> result:results){
                Item item = result.get();
                if(item.lastModified().toInstant().isBefore(oneDayAgo)){
                    minioClient.removeObject(
                        RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(item.objectName())
                            .build()
                    );
                    log.info("已删除过期临时图片:{}",item.objectName());
                }
            }
        }catch(Exception e){
            log.error("清理临时评论图片失败",e);
        }
    }
}
