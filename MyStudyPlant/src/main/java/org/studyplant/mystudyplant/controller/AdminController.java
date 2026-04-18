package org.studyplant.mystudyplant.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.studyplant.mystudyplant.common.PageResult;
import org.studyplant.mystudyplant.common.Result;
import org.studyplant.mystudyplant.common.converter.ArticleConverter;
import org.studyplant.mystudyplant.entity.Article;
import org.studyplant.mystudyplant.entity.User;
import org.studyplant.mystudyplant.repository.ArticleRepository;
import org.studyplant.mystudyplant.repository.UserRepository;
import org.studyplant.mystudyplant.vo.AdminStatsVO;
import org.studyplant.mystudyplant.vo.AdminUserVO;
import org.studyplant.mystudyplant.vo.ArticleListItemVO;

import cn.dev33.satoken.annotation.SaCheckRole;
import cn.dev33.satoken.stp.StpUtil;

@RestController
@RequestMapping("/admin")
@SaCheckRole("ADMIN") // 只有具有 ADMIN 角色的用户才能访问这个控制器
public class AdminController {
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private ArticleConverter articleConverter; 

    //1获取数据大盘统计
    @GetMapping("/stats")
    public Result<AdminStatsVO> getStats(){
        AdminStatsVO stats = new AdminStatsVO();
        stats.setTotalUsers(userRepository.count());
        stats.setTotalArticles(articleRepository.count());
        // 如果你有 commentRepository，可以查总评论数
        // stats.setTotalComments(commentRepository.count());
        
        return Result.success("获取大盘数据成功", stats);
    }

        /**
     * 2. 全局文章搜索与列表
     */
    @GetMapping("/articles")
    public Result<PageResult<ArticleListItemVO>> getArticles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Article> articlePage;
        
        if (StringUtils.hasText(keyword)) {
            articlePage = articleRepository.findByTitleContainingOrContentContaining(keyword, keyword, pageable);
        } else {
           articlePage = articleRepository.findAll(pageable);
        }
        
        // 转换得到 VO 列表
        List<ArticleListItemVO> vos = articlePage.getContent().stream()
                .map(articleConverter::toListItemVO)
                .collect(Collectors.toList());

        // 重新包装成分页对象
        Page<ArticleListItemVO> voPage = new org.springframework.data.domain.PageImpl<>(
                vos, pageable, articlePage.getTotalElements());

        return Result.success("获取列表成功", PageResult.of(voPage));
    }

        /**
     * 3. 下架/删除指定文章
     */
    @DeleteMapping("/article/{id}")
    public Result<String> deleteArticle(@PathVariable Long id) {
        // 由于需要级联删除，最好的做法其实是调用 Service，或者写好外键约束。这里直接调库做粗暴处理：
        if (!articleRepository.existsById(id)) {
            return Result.error(400, "文章不存在");
        }
        
        // 可选：如果用代码做级联删除：
        // commentRepository.deleteAllByArticleId(id);
        
        articleRepository.deleteById(id);
        return Result.success("文章及其附属数据已被强力清除_(:3」∠)_", null);
    }

    /**
     * 4-A. 用户列表与搜索
     */
    @GetMapping("/users")
    public Result<PageResult<AdminUserVO>> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String keyword) {

        // 用户按 ID 或者时间倒序
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<User> userPage;

        if (StringUtils.hasText(keyword)) {
            userPage = userRepository.findByUsernameContainingOrEmailContaining(keyword, keyword, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        // 把原始实体 User 转为 AdminUserVO 以不暴露密码等敏感信息
        List<AdminUserVO> vos = userPage.getContent().stream().map(user -> {
            AdminUserVO vo = new AdminUserVO();
            vo.setId(user.getId());
            vo.setUsername(user.getUsername());
            vo.setEmail(user.getEmail());
            // 如果旧数据没有填状态，赋个默认值 1 (正常)
            vo.setStatus(user.getStatus() != null ? user.getStatus() : 1);
            vo.setCreateTime(user.getCreateTime());
            return vo;
        }).collect(Collectors.toList());

        Page<AdminUserVO> voPage = new org.springframework.data.domain.PageImpl<>(
                vos, pageable, userPage.getTotalElements());

        return Result.success("获取用户列表成功", PageResult.of(voPage));
    }

    /**
     * 4-B. 修改用户状态（封禁 / 解封）
     */
    @PutMapping("/user/{id}/status")
    public Result<String> changeUserStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer newStatus = body.get("status");
        if (newStatus == null || (newStatus != 0 && newStatus != 1)) {
            return Result.error(400, "非法的状态值");
        }

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return Result.error(400, "用户不存在");
        }

        // 核心封禁打脸逻辑
        user.setStatus(newStatus);
        userRepository.save(user);

        if (newStatus == 0) {
            // Sa-Token 绝杀技：强行将该用户踢下线并禁用账号
            StpUtil.kickout(id); 
            // 也可以用高级的封禁 API：StpUtil.disable(id, -1); 表示无期徒刑
            return Result.success("目标用户已被封禁并强制下线", null);
        } else {
            // StpUtil.untieDisable(id); // 如果用了 disable 就需要 untie
            return Result.success("用户解封成功", null);
        }
    }

}
