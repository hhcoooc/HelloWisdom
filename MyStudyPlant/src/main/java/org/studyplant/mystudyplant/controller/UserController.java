package org.studyplant.mystudyplant.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.studyplant.mystudyplant.common.Result;
import org.studyplant.mystudyplant.common.constant.FileCategory;
import org.studyplant.mystudyplant.dto.FileUploadResult;
import org.studyplant.mystudyplant.dto.UserLoginRequest;
import org.studyplant.mystudyplant.dto.UserProfileUpdateRequest;
import org.studyplant.mystudyplant.dto.UserRegisterRequest;
import org.studyplant.mystudyplant.entity.User;
import org.studyplant.mystudyplant.repository.UserRepository;
import org.studyplant.mystudyplant.service.MinioService;
import org.studyplant.mystudyplant.service.UserService;
import org.studyplant.mystudyplant.vo.UserVO;

import cn.dev33.satoken.annotation.SaCheckLogin;
import cn.dev33.satoken.secure.BCrypt;
import cn.dev33.satoken.stp.SaTokenInfo;
import cn.dev33.satoken.stp.StpUtil;
import co.elastic.clients.elasticsearch.security.UserProfile;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private MinioService minioService;


    

    @PostMapping("/login")
    public Result<String> doLogin(@RequestBody UserLoginRequest request){

                User user = userService.login(request.getUsername(),request.getPassword());
                StpUtil.login(user.getId());
                SaTokenInfo tokenInfo = StpUtil.getTokenInfo();
                return Result.success("登录成功",tokenInfo.getTokenValue());

    }
    
    @PostMapping("/register")
    public Result<Void> doRegister (@RequestBody UserRegisterRequest request){

        userService.register(request.getUsername(),request.getPassword(),request.getEmail());
        return Result.success("注册成功");
    }

    @PostMapping("/avatar")
    @SaCheckLogin
    public Result<String> uploadAvatar(@RequestParam("file") MultipartFile file)throws Exception{
        Long userId = StpUtil.getLoginIdAsLong();
            FileUploadResult result = minioService.uploadFile(file, FileCategory.AVATAR, userId);
        String avatarUrl = result.getUrl();
        //更新用户表的avatar字段
        userService.updateAvatar(userId,avatarUrl);
        return Result.success("头像上传成功",avatarUrl);
    }
    
    @GetMapping("/info")
    @SaCheckLogin
    public Result<UserVO> getUserInfo(){
        Long userId = StpUtil.getLoginIdAsLong();
        UserVO userInfo = userService.getUserInfo(userId);
        return Result.success("获取用户信息成功",userInfo);
    
}

    @PostMapping("/profile")
    @SaCheckLogin
    public Result<Void> updateProfile(@RequestBody @Valid UserProfileUpdateRequest request){
        Long userId = StpUtil.getLoginIdAsLong();
        userService.updateProfile(userId, request);
        return Result.success("更新个人信息成功");

    }

    @PostMapping("/send-reset-code")
    public Result<Void> sendResetCode(@RequestBody org.studyplant.mystudyplant.dto.SendCodeRequest request) {
        userService.sendResetCode(request.getEmail());
        return Result.success("验证码发送成功");
    }

    @PostMapping("/reset-password")
    public Result<Void> resetPassword(@RequestBody org.studyplant.mystudyplant.dto.ResetPasswordRequest request) {
        userService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return Result.success("密码重置成功");
    }
}
