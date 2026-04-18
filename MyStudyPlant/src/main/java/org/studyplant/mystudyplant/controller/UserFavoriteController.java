package org.studyplant.mystudyplant.controller;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.studyplant.mystudyplant.common.PageResult;
import org.studyplant.mystudyplant.common.Result;
import org.studyplant.mystudyplant.dto.CollectResult;
import org.studyplant.mystudyplant.service.FavoriteService;
import org.studyplant.mystudyplant.vo.ArticleListItemVO;

import cn.dev33.satoken.annotation.SaCheckLogin;
import cn.dev33.satoken.stp.StpUtil;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class UserFavoriteController {
    private final FavoriteService userFavoriteService;

    @PostMapping("/{articleId}/toggle")
    @SaCheckLogin
    public Result<CollectResult> toggleFavorite(@PathVariable("articleId") Long articleId) {
        Long userId = cn.dev33.satoken.stp.StpUtil.getLoginIdAsLong();
        CollectResult result = userFavoriteService.toggleFavorite(userId, articleId);
        return Result.success("收藏状态已更新", result);
    }

    @GetMapping("/my")
    @SaCheckLogin
    public Result<PageResult<ArticleListItemVO>> getMyFavorites(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size) {
        
        //1. 获取当前用户ID
        Long userId = StpUtil.getLoginIdAsLong();

        //2. 调用服务层方法获取收藏列表
        Page<ArticleListItemVO> favoritePage = userFavoriteService.getUserFavorites(userId, page, size);
        // 3. 组装并返回标准统一下发格式 PageResult
        return Result.success("获取收藏列表成功", PageResult.of(favoritePage));
    }
}