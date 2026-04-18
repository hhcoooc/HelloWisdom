package org.studyplant.mystudyplant.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.checkerframework.checker.units.qual.A;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.studyplant.mystudyplant.common.CursorResult;
import org.studyplant.mystudyplant.common.PageResult;
import org.studyplant.mystudyplant.common.Result;
import org.studyplant.mystudyplant.document.ArticleDoc;
import org.studyplant.mystudyplant.dto.ArticlePublishRequest;
import org.studyplant.mystudyplant.dto.ArticleUpdateRequest;
import org.studyplant.mystudyplant.dto.LikeResult;
import org.studyplant.mystudyplant.entity.Article;
import org.studyplant.mystudyplant.repository.ArticleRepository;
import org.studyplant.mystudyplant.service.ArticleService;
import org.studyplant.mystudyplant.vo.ArticleListItemVO;
import org.studyplant.mystudyplant.vo.ArticleVO;

import cn.dev33.satoken.annotation.SaCheckLogin;
import cn.dev33.satoken.stp.StpUtil;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/article")
public class ArticleController {

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private ArticleService articleService;

    private ArticleVO convertToVo(Article article) {
    if (article == null) {
        return null;
    }
    ArticleVO vo = new ArticleVO();
    BeanUtils.copyProperties(article, vo); // 使用 Spring 的 BeanUtils 复制同名属性
    // 如果字段名不一致或需要特殊处理，手动设置
    // vo.setCreateTime(article.getCreateTime());
    return vo;
}

    @PostMapping("/publish")
    @SaCheckLogin
    public Result<ArticleVO> publishArticle(@RequestBody @Valid ArticlePublishRequest request){

        //调用服务层方法发布文章
        Article article = articleService.publishArticle(request);
        ArticleVO vo = convertToVo(article);
        return Result.success("发布文章成功",vo);
    }

    @PostMapping("/update")
    @SaCheckLogin
    public Result<ArticleVO> updateArticle(@RequestBody @Valid ArticleUpdateRequest request){
        Article article = articleService.updateArticle(request);
        ArticleVO vo = convertToVo(article);
        return Result.success("修改文章成功",vo);
    }

    @GetMapping("/list")
    public Result<CursorResult<ArticleListItemVO>> getArticleList(
        @RequestParam(required = false) Long cursorId,
        @RequestParam(defaultValue = "10") int pageSize,
        @RequestParam(required = false) Long categoryId){
        CursorResult<ArticleListItemVO> result = articleService.getArticlePage(cursorId, pageSize, categoryId);

        return Result.success("获取文章列表成功",result);
    }

    @GetMapping("/{id}")
    public Result<ArticleVO> getArticleDetail(@PathVariable("id") Long id){
        try {
            ArticleVO vo = articleService.getArticleDetail(id);
            return Result.success("获取成功",vo);
        } catch (Exception e) {
            //如果RuntimeException为空，还是能抛出异常信息
            String message = e.getMessage() != null ? e.getMessage() : "文章不存在";
            return Result.error(404, message);
        }
    }

    @PostMapping("/like/{articleId}")
    @SaCheckLogin
    public Result<LikeResult> toggleLike(@PathVariable("articleId") Long articleId){
        LikeResult result = articleService.toggleLike(articleId);
        String message = result.getLiked() ? "点赞成功" : "取消点赞成功";
        return Result.success(message, result);
    }

    @GetMapping("/feed")
    public Result<List<Article>> getFeed(@RequestParam(required = false) Long cursor,
    @RequestParam(defaultValue = "10") int size){
        //调用service方法获取文章列表
        List<Article> articles = articleService.getArticleFeed(cursor,size);
        return Result.success("获取文章列表成功",articles);
    }

    @GetMapping("/search")
    public Result<List<ArticleDoc>> search(@RequestParam("keyword") String keyword){
        List<ArticleDoc> results = articleService.searchArticles(keyword);
        return Result.success("搜索成功",results);
    }

    @DeleteMapping("/delete/{id}")
    @SaCheckLogin
    public Result<Void> deleteArticle(@PathVariable Long id) {
    articleService.deleteArticle(id);
    return Result.success("删除成功");
}

    @GetMapping("/my")
    @SaCheckLogin
    public Result<PageResult<ArticleListItemVO>> getMyPublishedArticles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        // 获取当前登录用户 ID
        Long userId = StpUtil.getLoginIdAsLong();
        
        // 调用你的 service 获取 Page 对象
        Page<ArticleListItemVO> articlePage = articleService.getMyPublishedArticles(userId, page, size);
        
        // 使用你系统里原有的 PageResult.of() 包装，这样可以将 Spring 的 content 转成咱们前端兼容的 list 结构
        return Result.success("获取发布成功", PageResult.of(articlePage));
    }

    @GetMapping("/my/liked")
    @SaCheckLogin
    public Result<PageResult<ArticleListItemVO>> getMyLikedArticles(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Long userId = StpUtil.getLoginIdAsLong();
        
        // 调用 ArticleService 中已有的获取点赞文章列表方法
        Page<ArticleListItemVO> articlePage = articleService.getMyLikedArticles(userId, page, size);
        
        // 返回前端统一格式
        return Result.success("获取点赞文章成功", PageResult.of(articlePage));
    }

    // ==========================================
    // 新增：我的浏览历史接口
    // ==========================================
    @GetMapping("/my/history")
    @SaCheckLogin
    public Result<PageResult<ArticleListItemVO>> getMyHistory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Long userId = StpUtil.getLoginIdAsLong();
        
        // 调用 Service
        Page<ArticleListItemVO> articlePage = articleService.getMyHistory(userId, page, size);
        
        // 返回符合前端框架的通用封装列表
        return Result.success("获取历史记录成功", PageResult.of(articlePage));
    }
    
    
    
    // ==========================================
    // SEO 专用：供前端 app/sitemap.ts 调用生成站点地图
    // ==========================================
    @GetMapping("/sitemap")
    public Result<List<org.studyplant.mystudyplant.vo.ArticleSitemapVO>> getSitemap() {
        // 直接调用投影构造查询，全量取出，不经过复杂的组装
        List<org.studyplant.mystudyplant.vo.ArticleSitemapVO> sitemapList = articleRepository.findAllForSitemap();
        return Result.success("获取地图列表成功", sitemapList);
    }

    //SSR专用：供前端layout.tsx 服务器端取Meta标签使用
    @GetMapping("/{id}/seo")
    @Cacheable(value = "article:seo", key = "#id", unless = "#result == null")
    public Result<Map<String, String>> getArticleSeo(@PathVariable("id") Long id) {
        // 其实直接拉实体类就可以，因为有 @Cacheable，这个查库动作只会在缓存过期前执行 1 次
        Article article = articleRepository.findById(id).orElse(null);
        if (article == null) {
            return Result.error(404, "未找到该文章");
        }
        
        // 剪裁极简响应格式
        Map<String, String> seoData = new HashMap<>();
        seoData.put("title", article.getTitle());
        seoData.put("summary", article.getSummary());
        seoData.put("imageUrl", article.getImageUrl());
        
        return Result.success("SEO 数据获取成功", seoData);
    }

    // ================== 【新增前端需要的两个暴露接口】 ==================
    
    @PostMapping("/draft")
    @SaCheckLogin
    public Result<Long> saveDraft(@RequestBody ArticleUpdateRequest request) {
        Long draftId = articleService.saveDraft(request);
        // 把那个唯一的救命 ID 返回前端
        return Result.success("草稿自动保存成功", draftId);
    }

    @GetMapping("/my/drafts")
    @SaCheckLogin
    public Result<PageResult<ArticleListItemVO>> getMyDrafts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Long userId = StpUtil.getLoginIdAsLong();
        Page<ArticleListItemVO> articlePage = 
                articleService.getMyDrafts(userId, page, size);
        
        return Result.success("获取草稿成功", PageResult.of(articlePage));
    }
}
