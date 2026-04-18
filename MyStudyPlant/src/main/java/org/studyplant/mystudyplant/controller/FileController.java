package org.studyplant.mystudyplant.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.studyplant.mystudyplant.common.constant.FileCategory;
import org.studyplant.mystudyplant.dto.FileUploadRequest;
import org.studyplant.mystudyplant.dto.FileUploadResult;
import org.studyplant.mystudyplant.service.MinioService;

import cn.dev33.satoken.annotation.SaCheckLogin;
import cn.dev33.satoken.stp.StpUtil;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/files")
public class FileController {
    
    @Autowired
    private MinioService minioService;

    /* 文件上传接口 
    @param file 上传的文件
    @param category 文件分类（决定存储路径前缀）(如：avatars、articles、drafts等)
    @param userId 用户ID（仅当分类为草稿附件时需要，用于私有路径）
    */

    @PostMapping("/upload")
    @SaCheckLogin
    public ResponseEntity<Map<String,String>> uploadFile(@RequestPart("file") MultipartFile file,
            @ModelAttribute @Valid FileUploadRequest request){

        try{
            Long userId = StpUtil.getLoginIdAsLong();
            FileUploadResult result = minioService.uploadFile(file, request.getCategory(), userId);
            Map<String, String> response = new HashMap<>();
            response.put("url", result.getUrl());
            response.put("objectName", result.getObjectName());
            return ResponseEntity.ok(response);
        }catch(Exception e){
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "文件上传失败:" + e.getMessage()));
        }
    }
}
