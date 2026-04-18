package org.studyplant.mystudyplant.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.studyplant.mystudyplant.dto.KbAddNodeRequest;
import org.studyplant.mystudyplant.dto.KbCreateRequest;
import org.studyplant.mystudyplant.dto.KbUpdateRequest;
import org.studyplant.mystudyplant.entity.KnowledgeBase;
import org.studyplant.mystudyplant.entity.KnowledgeNode;
import org.studyplant.mystudyplant.repository.KnowledgeNodeRepository;
import org.studyplant.mystudyplant.repository.KonwledgeBaseRepository;
import org.studyplant.mystudyplant.vo.KnowledgeBaseVO;
import org.studyplant.mystudyplant.vo.KnowledgeNodeVO;
import org.studyplant.mystudyplant.vo.UserVO;

import cn.dev33.satoken.stp.StpUtil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KnowledgeBaseService {

    private final KonwledgeBaseRepository kbRepository;
    private final KnowledgeNodeRepository nodeRepository;
    private final UserService userService;// 注入 UserService 用于获取用户信息

    //将组装逻辑提取：Entity -> VO，并注入用户信息
    private KnowledgeBaseVO convertToVO(KnowledgeBase kb) {
        KnowledgeBaseVO vo = new KnowledgeBaseVO();
        BeanUtils.copyProperties(kb, vo);
        try {
            // 获取作者信息，回填姓名与头像
            UserVO authorInfo = userService.getUserInfo(kb.getAuthorId());
            vo.setAuthorName(authorInfo.getUsername());
            vo.setAuthorAvatar(authorInfo.getAvatar());
        } catch (Exception e) {
            vo.setAuthorName("佚名");
        }
        return vo;
    }


    // 1. 获取专栏列表
    public List<KnowledgeBaseVO> getKnowledgeBaseList() {
        return kbRepository.findAll().stream()
        .map(this::convertToVO)
        .collect(Collectors.toList());
    }

    // ===================================
    // 新增：获取当前用户创建的专栏列表
    // ===================================
    public List<KnowledgeBaseVO> getMyKnowledgeBases() {
        Long authorId = StpUtil.getLoginIdAsLong();
        return kbRepository.findByAuthorIdOrderByIdDesc(authorId).stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());
    }

    // 2. 获取专栏下组装好的树形节点
    public List<KnowledgeNodeVO> getKnowledgeNodeTree(Long kbId) {
        // 第一步：一次性查出该专栏下所有节点（减少查库次数，这也是高级开发的原则）
        List<KnowledgeNode> allNodes = nodeRepository.findByKbIdOrderBySortOrderAsc(kbId);
        
        // 第二步：全部转化为VO
        List<KnowledgeNodeVO> allVOs = allNodes.stream().map(node -> {
            KnowledgeNodeVO vo = new KnowledgeNodeVO();
            BeanUtils.copyProperties(node, vo);
            return vo;
        }).collect(Collectors.toList());

        // 第三步：转成 Map 方便找爹（避免双重 for 循环带来 O(N²) 的性能问题）
        Map<Long, KnowledgeNodeVO> nodeMap = allVOs.stream()
                .collect(Collectors.toMap(KnowledgeNodeVO::getId, vo -> vo));

        List<KnowledgeNodeVO> rootNodes = new ArrayList<>();

        // 第四步：挂载父子关系
        for (KnowledgeNodeVO node : allVOs) {
            // 如果它没爹，或者是 0，它就是根节点，直接怼到结果集里
            if (node.getParentId() == null || node.getParentId() == 0L) {
                rootNodes.add(node);
            } else {
                // 如果它有爹，去 Map 里拿到它爹，把它自己塞进它爹的 children 怀抱里
                KnowledgeNodeVO parent = nodeMap.get(node.getParentId());
                if (parent != null) {
                    parent.getChildren().add(node);
                }
            }
        }

        return rootNodes;
    }

    // ===================================
    // 3. 创建新知识库 (专栏)
    // ===================================
    public KnowledgeBase createKnowledgeBase(KbCreateRequest request) {
        // 利用 Sa-Token 自动获取当前登录用户的 ID 作为专栏作者
        Long authorId = StpUtil.getLoginIdAsLong();

        KnowledgeBase kb = new KnowledgeBase();
        kb.setTitle(request.getTitle());
        kb.setDescription(request.getDescription());
        kb.setCoverUrl(request.getCoverUrl());
        kb.setAuthorId(authorId);

        return kbRepository.save(kb);
    }

    // ===================================
    // 4. 将文章作为节点挂载到知识库下
    // ===================================
    public KnowledgeNode addKnowledgeNode(Long kbId, KbAddNodeRequest request) {
        KnowledgeNode node = new KnowledgeNode();
        node.setKbId(kbId);
        // 如果前端没有传 parentId，则默认丢在根目录(0)
        node.setParentId(request.getParentId() != null ? request.getParentId() : 0L);
        node.setTitle(request.getTitle());
        node.setArticleId(request.getArticleId());
        
        // 默认排序值，如果有需求后续可以再做排序更新接口
        node.setSortOrder(99); 
        
        return nodeRepository.save(node);
    }

        // ===================================
    // 新增：修改知识库(专栏)信息
    // ===================================
    @Transactional
    public void updateKnowledgeBase(Long kbId, KbUpdateRequest request) {
        Long currentUserId = StpUtil.getLoginIdAsLong();
        KnowledgeBase kb = kbRepository.findById(kbId)
                .orElseThrow(() -> new RuntimeException("专栏不存在"));

        // 校验权限：只能修改自己的专栏，如果是管理员则跳过
        if (!kb.getAuthorId().equals(currentUserId) && currentUserId != 1L) {
            throw new RuntimeException("哎呀！无权修改别人的专栏");
        }

        kb.setTitle(request.getTitle());
        kb.setDescription(request.getDescription());
        kb.setCoverUrl(request.getCoverUrl());

        kbRepository.save(kb);
    }

    
    // ===================================
    // 新增：删除专栏
    // ===================================
    @Transactional
    public void deleteKnowledgeBase(Long kbId) {
        Long currentUserId = StpUtil.getLoginIdAsLong();
        KnowledgeBase kb = kbRepository.findById(kbId)
                .orElseThrow(() -> new RuntimeException("专栏不存在"));

        if (!kb.getAuthorId().equals(currentUserId) && currentUserId != 1L) {
            throw new RuntimeException("哎呀！无权删除别人的专栏");
        }

        // 实际开发中应该需要连带删除附属于它的 node 节点记录。
        // （视业务情况而论，或者设定数据库级联外键删除）
        // nodeRepository.deleteByKbId(kbId); 

        kbRepository.delete(kb);
    }
}
