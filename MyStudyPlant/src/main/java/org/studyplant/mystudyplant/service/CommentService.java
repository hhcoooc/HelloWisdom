package org.studyplant.mystudyplant.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collector;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.studyplant.mystudyplant.dto.CommentPublishRequest;
import org.studyplant.mystudyplant.dto.SendCodeRequest;
import org.studyplant.mystudyplant.entity.Article;
import org.studyplant.mystudyplant.entity.Comment;
import org.studyplant.mystudyplant.entity.Notification;
import org.studyplant.mystudyplant.event.NotificationEvent;
import org.studyplant.mystudyplant.repository.ArticleRepository;
import org.studyplant.mystudyplant.repository.CommentRepository;
import org.studyplant.mystudyplant.repository.UserRepository;
import org.studyplant.mystudyplant.vo.CommentVO;

import io.minio.Result;

import org.studyplant.mystudyplant.entity.User;


@Service
public class CommentService {
    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private UserRepository userRepository;


    //发布评论
    public Comment publishComment(CommentPublishRequest dto,Long authorId){
        boolean articleExists = articleRepository.existsById(dto.getArticleId());
        if (!articleExists) {
            throw new RuntimeException("评论失败：文章不存在");
        }

        Comment comment = new Comment();
        comment.setArticleId(dto.getArticleId());
        comment.setAuthorId(authorId);
        comment.setContent(dto.getContent());
        comment.setParentId(dto.getParentId());
        comment.setImageUrl(dto.getImageUrl());

        // 【新增】：保存目标用户名
        comment.setTargetUserName(dto.getTargetUserName());
        
        if (dto.getParentId() != null && dto.getParentId() != 0) {
            boolean parentExists = commentRepository.existsById(dto.getParentId());
            if (!parentExists) {
                throw new RuntimeException("回复失败：目标评论不存在");
            }
            comment.setParentId(dto.getParentId());
        }
        // 保存评论
        Comment savedComment = commentRepository.save(comment);
        
        // 发布评论通知
        publishCommentNotification(authorId, savedComment);
        
        return savedComment;
    }
    
    //获取文章的评论列表(按创建时间倒序)
    public List<Comment> getCommentsByArticleId(Long articleId){
        return commentRepository.findByArticleIdOrderByCreateTimeAsc(articleId);
    }

    private void publishCommentNotification(Long senderId, Comment comment) {
        // 1. 截取内容（防止内容过长撑爆消息列表）
        String text = comment.getContent();
        if (text != null && text.length() > 20) {
            text = text.substring(0, 20) + "...";
        }

        // 2. 获取文章信息，如果找不到直接退出
        Article article = articleRepository.findById(comment.getArticleId()).orElse(null);
        if (article == null) {
            return;
        }

        // 3. 判断是一级评论还是楼中楼回复
        if (comment.getParentId() != null) {
            // ==========================================
            // 【情况 A】这是“楼中楼”回复：需要发最多两条通知
            // ==========================================
            Comment parentComment = commentRepository.findById(comment.getParentId()).orElse(null);
            if (parentComment != null) {
                // 第一条：发给【被回复的那个人（父评论作者）】
                // 【新增拦截】：如果自己回复自己，不触发互相提醒
                if (!senderId.equals(parentComment.getAuthorId())) {
                    Notification replyNotification = new Notification();
                    replyNotification.setSenderId(senderId);
                    replyNotification.setReceiverId(parentComment.getAuthorId());
                    replyNotification.setType(2); 
                    replyNotification.setTargetId(comment.getArticleId());
                    replyNotification.setContent("回复了你的评论: " + text);

                    replyNotification.setCommentId(comment.getId()); // 【新增一】：绑定触发该通知的评论ID

                    eventPublisher.publishEvent(new NotificationEvent(this, replyNotification));
                }
                // 第二条：发给【文章的原作者】
                // (加个判断：如果父评论作者就是文章作者，那就不用重复发两条了)
                if (!parentComment.getAuthorId().equals(article.getAuthorId()) && !senderId.equals(article.getAuthorId())) {
                    // 查出被回复人的昵称
                    String parentAuthorName = userService.getUserNameById(parentComment.getAuthorId());
                    
                    Notification authorNotification = new Notification();
                    authorNotification.setSenderId(senderId);
                    authorNotification.setReceiverId(article.getAuthorId());
                    authorNotification.setType(2);
                    authorNotification.setTargetId(comment.getArticleId());
                    // 组装带 @昵称 的样式
                    authorNotification.setContent("在你的文章中回复了 @" + parentAuthorName + " : " + text);
                    authorNotification.setCommentId(comment.getId()); // 【新增二】：绑定触发该通知的评论ID
                    eventPublisher.publishEvent(new NotificationEvent(this, authorNotification));
                }
            }
        } else {
            // ==========================================
            // 【情况 B】这是直接针对文章的首层评论：只会发给文章作者
            // ==========================================
            // 【新增拦截】：如果是自己评论自己的文章，直接不发通知
            if (!senderId.equals(article.getAuthorId())) {
                Notification notification = new Notification();
                notification.setSenderId(senderId);
                notification.setReceiverId(article.getAuthorId());
                notification.setType(2);
                notification.setTargetId(comment.getArticleId());
                notification.setContent("评论了你的文章: " + text);

                notification.setCommentId(comment.getId()); // 【新增三】：绑定触发该通知的评论ID
                
                eventPublisher.publishEvent(new NotificationEvent(this, notification));
            }
        }
    }

    public List<CommentVO> getCommentTreeByArticleId(Long articleId){
        //一次性从数据库捞出所有相关评论，按时间排序
        List<Comment> allComments = commentRepository.findByArticleIdOrderByCreateTimeAsc(articleId);

        if(allComments.isEmpty()){
            return new ArrayList<>();
        }

        //收集所有涉及到的用户ID（评论作者和被回复的目标用户），准备批量查询用户信息防止N+1问题
        List<Long> userIds = allComments.stream().map(Comment::getAuthorId).distinct().collect(Collectors.toList());
        Map<Long,User> userMap = userRepository.findAllById(userIds)
            .stream().collect(Collectors.toMap(User::getId, u -> u));
        
        //将所有Entity转成VO
        List<CommentVO> allVOs = allComments.stream().map(comment -> {
            CommentVO vo = new CommentVO();
            BeanUtils.copyProperties(comment, vo);

            //填充评论者信息
            User author = userMap.get(comment.getAuthorId());
            if (author != null) {
                vo.setAuthorName(author.getUsername());
                vo.setAuthorAvatar(author.getAvatar());
            }
            return vo;
        }).collect(Collectors.toList());

        //开始在内存中将数据结构化：主评论与子评论分流
        List<CommentVO> rootComments = new ArrayList<>();//一级评论列表

        //建立一张表:快速通过ID找到对应的评论对象
        Map<Long, CommentVO> commentMap = allVOs.stream().collect(Collectors.toMap(CommentVO::getId, v -> v));

        for(CommentVO vo : allVOs){
            //如果parentId是null或者0，说明这是一级评论，直接放到rootComments里
            if (vo.getParentId() == null || vo.getParentId() == 0L) {
                //初始化它的回复列表，并放进根集合
                vo.setReplies(new ArrayList<>());
                rootComments.add(vo);
            }else{
                //如果parentId不为null，说明这是一个回复评论，我们需要把它放到父评论的replies里
                CommentVO parent = commentMap.get(vo.getParentId());
                if (parent != null) {
                    //展平回复树
                    CommentVO root = findRootComment(vo,commentMap);
                    if (root != null) {
                        if (root.getReplies() == null) {
                            root.setReplies(new ArrayList<>());
                        }
                        root.getReplies().add(vo);
                    }
                    
                }
            }
        }
            return rootComments;
    }

    private CommentVO findRootComment(CommentVO child, Map<Long, CommentVO> map) {
        CommentVO current = child;
        while (current.getParentId() != null && current.getParentId() != 0L) {
            current = map.get(current.getParentId());
            if (current == null) {
                return null;
            }
        }
        return current;
    }
}
