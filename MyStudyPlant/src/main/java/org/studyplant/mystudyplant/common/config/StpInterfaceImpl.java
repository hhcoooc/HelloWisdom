package org.studyplant.mystudyplant.common.config;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.studyplant.mystudyplant.service.UserService;

import cn.dev33.satoken.stp.StpInterface;

/** 自定义权限验证接口拓展 */
@Component
public class StpInterfaceImpl implements StpInterface {
    @Autowired
    private UserService userService;

    @Override
    public List<String> getRoleList(Object loginId,String loginType){
        List<String> roles = new ArrayList<>();
        long userId = Long.parseLong(loginId.toString());

        //极简方案：根据用户ID查询用户角色列表，如果是管理员则返回管理员角色，否则返回普通用户角色
        //实际项目中可以根据业务需求查询数据库或其他数据源获取用户角色信息
        if (userId == 1L) {
            roles.add("ADMIN");
        }
        return roles;
    }

    @Override
    public List<String> getPermissionList(Object loginId,String loginType){
        //暂不需要细粒度的按钮级权限，所以返回空列表
        return Collections.emptyList();
    }
}
