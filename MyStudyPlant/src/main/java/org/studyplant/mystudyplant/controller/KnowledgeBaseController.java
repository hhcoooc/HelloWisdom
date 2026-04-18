package org.studyplant.mystudyplant.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.studyplant.mystudyplant.common.Result;
import org.studyplant.mystudyplant.dto.KbAddNodeRequest;
import org.studyplant.mystudyplant.dto.KbCreateRequest;
import org.studyplant.mystudyplant.dto.KbUpdateRequest;
import org.studyplant.mystudyplant.entity.KnowledgeBase;
import org.studyplant.mystudyplant.service.KnowledgeBaseService;
import org.studyplant.mystudyplant.vo.KnowledgeBaseVO;
import org.studyplant.mystudyplant.vo.KnowledgeNodeVO;

import cn.dev33.satoken.annotation.SaCheckLogin;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/kb")
@RequiredArgsConstructor
public class KnowledgeBaseController {
    
    private final KnowledgeBaseService kbService;

    @GetMapping("/list")
    public Result<List<KnowledgeBaseVO>> getKbList() {
        return Result.success("获取专栏列表成功", kbService.getKnowledgeBaseList());
    }

    @GetMapping("/{kbId}/tree")
    public Result<List<KnowledgeNodeVO>> getKbTree(@PathVariable("kbId") Long kbId) {
        return Result.success("获取目录树成功", kbService.getKnowledgeNodeTree(kbId));
    }

    // ===================================
    // 1. 创建新知识库 (专栏)
    // ===================================
    @PostMapping("/create")
    @SaCheckLogin
    public Result<Long> createKb(@RequestBody KbCreateRequest request) {
        KnowledgeBase savedKb = kbService.createKnowledgeBase(request);
        return Result.success("创建专栏成功", savedKb.getId());
    }

    // ===================================
    // 3. 将文章挂载/导入知识库 (添加节点)
    // ===================================
    @PostMapping("/{kbId}/add-article")
    @SaCheckLogin
    public Result<Long> addArticleToKb(
            @PathVariable("kbId") Long kbId,
            @RequestBody KbAddNodeRequest request) {
        
        // 保存并返回刚新建层级节点的主键
        Long newNodeId = kbService.addKnowledgeNode(kbId, request).getId();
        return Result.success("成功挂载到专栏", newNodeId);
    }

    // ===================================
    // 新增：获取我的当前专栏列表
    // ===================================
    @GetMapping("/my")
    @SaCheckLogin
    public Result<List<KnowledgeBaseVO>> getMyKbList() {
        return Result.success("获取我的专栏成功", kbService.getMyKnowledgeBases());
    }

    // ===================================
    // 新增：修改知识库专栏基本信息
    // ===================================
    @PutMapping("/{kbId}")
    @SaCheckLogin
    public Result<Void> updateKb(
            @PathVariable("kbId") Long kbId,
            @RequestBody KbUpdateRequest request) {
        kbService.updateKnowledgeBase(kbId, request);
        return Result.success("编辑专栏成功", null);
    }

    // ===================================
    // 新增：删除知识库专栏
    // ===================================
    @DeleteMapping("/{kbId}")
    @SaCheckLogin
    public Result<Void> deleteKb(@PathVariable("kbId") Long kbId) {
        kbService.deleteKnowledgeBase(kbId);
        return Result.success("删除成功", null);
    }
}
