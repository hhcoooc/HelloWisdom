package org.studyplant.mystudyplant.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.studyplant.mystudyplant.common.constant.FileCategory;
import org.studyplant.mystudyplant.dto.FileUploadResult;

import cn.hutool.core.date.DateTime;
import io.minio.CopyObjectArgs;
import io.minio.CopySource;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;


@Service
public class MinioService {

    @Autowired
    private MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.endpoint}")
    private String endpoint;


     /**
     * 根据文件分类上传，返回可访问的 URL
     * @param file 上传的文件
     * @param category 文件分类（决定存储路径前缀）
     * @param userId 用户ID（用于私有路径）
     * @return 文件访问URL
     */
    public FileUploadResult uploadFile(MultipartFile file, FileCategory category, Long userId)throws Exception{
        //生成唯一的文件名，避免覆盖
        String originalFilename = file.getOriginalFilename();
        String suffix = originalFilename.substring(originalFilename.lastIndexOf("."));
        String fileName = UUID.randomUUID() + suffix;

        //构建对象名称(带前缀)
        String objectName;
        if(category == FileCategory.DRAFT_ATTACHMENT || category == FileCategory.COMMENT_TEMP){
            objectName = category.getPrefix() + userId + "/" + fileName; //私有文件按用户分目录
        }else if (category == FileCategory.AVATAR) {
            //头像不分日期分目录，直接存储
            objectName = category.getPrefix() + fileName;
            
        }
        else{
            //公开路径:public/avatars/或public/articles/yyyy/MM/
            //加入日期子目录
            String dataPath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
            objectName = category.getPrefix() + dataPath +"/" + fileName;
        }


        //上传文件到MinIO
        PutObjectArgs args = PutObjectArgs.builder()
                .bucket(bucketName)
                .object(objectName)
                .stream(file.getInputStream(), file.getSize(), -1)
                .contentType(file.getContentType())
                .build();
        minioClient.putObject(args);

        //获取文件访问URL
        //如果桶是public的，可以直接返回URL，否则生成预签名URL

        String fileUrl = getFileUrl(objectName,category);
        return new FileUploadResult(fileUrl, objectName);
    }

    //根据对象路径和分类返回可访问的URL
    //公开文件直接返回URL，私有文件生成预签名URL
    private String getFileUrl(String objectName,FileCategory category) throws Exception{
        if(category == FileCategory.DRAFT_ATTACHMENT || category == FileCategory.COMMENT_TEMP){
            //私有文件生成预签名URL
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                .method(Method.GET)
                .bucket(bucketName)
                .object(objectName)
                .expiry(1, TimeUnit.HOURS)//有效期7天
                .build()
            );
        }else{
            //公开文件直接返回URL
            return endpoint + "/" + bucketName + "/" + objectName;
        }
    }

    public void deleteFile(String objectName) throws Exception{
        minioClient.removeObject(
            RemoveObjectArgs.builder()
            .bucket(bucketName)
            .object(objectName)
            .build()
        );
    }


    public String getEndpoint(){
        return endpoint;
    }

    public String getBucketName(){
        return bucketName;
    }

    public void moveFile(String sourceObject , String destObject) throws Exception{
        //复制对象
        minioClient.copyObject(
            CopyObjectArgs.builder()
                .bucket(bucketName)
                .object(destObject)
                .source(CopySource.builder().bucket(bucketName).object(sourceObject).build())
                .build()

        );

        //删除源对象
        minioClient.removeObject(
            RemoveObjectArgs.builder()
                .bucket(bucketName)
                .object(sourceObject)
                .build()
        );
    }

    /*
    *从MinIO预签名URL中提取对象路径(objectName)
    *假设URL格式:{endpoint}/{bucketName}/{objectName}?签名参数
    */
    public String extractObjectNameFromUrl(String url){
        String base = endpoint + "/" + bucketName + "/";
        if(url.startsWith(base)){
            int queryIndex = url.indexOf('?');
            if(queryIndex != -1){
                return url.substring(base.length(),queryIndex);
            }else{
                return url.substring(base.length());
            }
        }
        throw new IllegalArgumentException("Invalid MinIO URL: " + url);
    }

    /**
    * 根据临时 objectName 生成公开的 objectName
    * 格式：public/comments/yyyy/MM/原文件名
    */
    public String generatePublicObjectName(String tempObjectName, FileCategory publicCategory) {
        String fileName = tempObjectName.substring(tempObjectName.lastIndexOf('/') + 1);
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM"));
        return publicCategory.getPrefix() + datePath + "/" + fileName;
    }

    //高级封装：将临时URL转存为公开URL，并返回公开URL;
    public String moveTempUrlToPublic(String tempUrl , FileCategory targetCategory) throws Exception{
        String tempObjectName = extractObjectNameFromUrl(tempUrl);
        String publicObjectName = generatePublicObjectName(tempObjectName, targetCategory);
        moveFile(tempObjectName, publicObjectName);//复用已有的moveFile方法
        return endpoint + "/" + bucketName + "/" + publicObjectName;
    }

}

