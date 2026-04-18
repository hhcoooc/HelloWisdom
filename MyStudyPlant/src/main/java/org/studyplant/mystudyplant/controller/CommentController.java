package org.studyplant.mystudyplant.controller;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.studyplant.mystudyplant.common.Result;
import org.studyplant.mystudyplant.common.constant.FileCategory;
import org.studyplant.mystudyplant.dto.CommentPublishRequest;
import org.studyplant.mystudyplant.entity.Comment;
import org.studyplant.mystudyplant.service.CommentService;
import org.studyplant.mystudyplant.service.MinioService;
import org.studyplant.mystudyplant.vo.CommentVO;

import ch.qos.logback.core.joran.util.beans.BeanUtil;
import cn.dev33.satoken.annotation.SaCheckLogin;
import cn.dev33.satoken.stp.StpUtil;
import jakarta.validation.Valid;
import jakarta.websocket.server.PathParam;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/comments")
public class CommentController {
    
    @Autowired
    private CommentService commentService;

    @Autowired
    private MinioService minioService;

    @Value("${minio.endpoint}")
    private String minioEndpoint;

    @Value("${minio.bucket-name}")
    private String bucketName;

    //发布评论(需要登录)

    @PostMapping("/publish")
    @SaCheckLogin
    public Result<CommentVO> publishComment(@RequestBody @Valid CommentPublishRequest dto )throws Exception{

            Long authorId = StpUtil.getLoginIdAsLong();
            //处理图片，如果imageUrl是临时私有地址，则转移到公开路径
            if(dto.getImageUrl() != null && dto.getImageUrl().contains("/private/comments/temp")){
                String publicUrl = minioService.moveTempUrlToPublic(dto.getImageUrl(),FileCategory.COMMENT_IMAGE);
                dto.setImageUrl(publicUrl);
            }
            

            Comment comment = commentService.publishComment(dto,authorId);
            CommentVO vo = convertToVo(comment);
            return Result.success("评论发布成功",vo);
        


    }

    private CommentVO convertToVo(Comment comment){
        CommentVO vo = new CommentVO();
        BeanUtils.copyProperties(comment, vo);
        return vo;
    }

    //获取文章的评论列表(公开接口,不需要登录)
    @GetMapping("/{articleId}/comments")
    // 这里把泛型也改成了 CommentVO
    public Result<List<CommentVO>> getComments(@PathVariable("articleId") Long articleId) {
        // 调用我们刚刚写的魔法 Tree 方法
        List<CommentVO> comments = commentService.getCommentTreeByArticleId(articleId);
        return Result.success("获取评论列表成功", comments);
    }
}
