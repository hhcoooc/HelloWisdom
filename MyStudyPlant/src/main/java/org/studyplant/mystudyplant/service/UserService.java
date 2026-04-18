package org.studyplant.mystudyplant.service;

import java.util.Random;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.studyplant.mystudyplant.dto.UserProfileUpdateRequest;
import org.studyplant.mystudyplant.entity.User;
import org.studyplant.mystudyplant.repository.UserRepository;
import org.studyplant.mystudyplant.vo.UserVO;

import cn.dev33.satoken.secure.BCrypt;

@Service
public class UserService {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepository;

    @Value("${spring.mail.username}")
    private String fromEmail; 

    public User register(String username,String password,String email){

        // 【新增安全拦截】：禁止任何小虾米起名为 admin
        if ("admin".equalsIgnoreCase(username) || "root".equalsIgnoreCase(username) || "system".equalsIgnoreCase(username)) {
            throw new RuntimeException("该用户名已被系统保留，禁止注册！");
        }

        User existingUser = userRepository.findByUsername(username);
        if(existingUser!=null){
        throw new RuntimeException("用户名已存在");
    }else{
    //密码加密
    String encodedPassword = BCrypt.hashpw(password,BCrypt.gensalt());
    //创建用户对象并保存到数据库
    User user = new User();
    user.setUsername(username);
    user.setPassword(encodedPassword);
    user.setEmail(email);

    return userRepository.save(user);
    }


}

    public User login(String identifier,String password){
        identifier = identifier.trim();
        User user = userRepository.findByUsernameOrEmail(identifier,identifier);
        //检查用户是否存在
        if(user == null){
            throw new RuntimeException("账号或密码错误");
        }
        else{
            if(!BCrypt.checkpw(password,user.getPassword())){
                throw new RuntimeException("账号或密码错误");
            }

             // ============== 【新增封禁检测】 ==============
            // 如果他的 status 明确被管理员标记为 0（封禁）
            if (user.getStatus() != null && user.getStatus() == 0) {
                throw new RuntimeException("该账号涉嫌违规，已被管理员永久封禁！");
            }
            // ===========================================

            return user;
            
        }
    }

    public void updateAvatar(Long userId,String avatarUrl){
        User user = userRepository.findById(userId)
                .orElseThrow(()->new RuntimeException("用户不存在"));
        user.setAvatar(avatarUrl);
        userRepository.save(user);
    }

    @Cacheable(value = "user:name", key = "#userId")//把结果存入到Redis缓存，减少循环查库
    public String getUserNameById(Long userId){
        return userRepository.findById(userId)
                .map(User::getUsername)
                .orElse("未知用户");
    }

    //获取用户信息并转换为VO对象
    public UserVO getUserInfo(Long userId){
        User user = userRepository.findById(userId)
                .orElseThrow(()->new RuntimeException("用户不存在"));
                
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        return vo;
    }

    //更新用户信息(用户名和邮箱)
    public void updateProfile(Long userId,UserProfileUpdateRequest request){
        User user = userRepository.findById(userId)
                .orElseThrow(()->new RuntimeException("用户不存在"));
        
        //如果用户改了用户名，且新老用户名不同，则检查用户名是否冲突
        if (!user.getUsername().equals(request.getUsername())) {
            User existingUser = userRepository.findByUsername(request.getUsername());
            if(existingUser != null){
                throw new RuntimeException("该用户名已被占用");
            }
            user.setUsername(request.getUsername());
        }

        //如果用户改了邮箱，且新老邮箱不同，则检查邮箱是否冲突
        if (request.getEmail() !=  null && !request.getEmail().equals(user.getEmail())) {
            User existingEmailUser = userRepository.findByEmail(request.getEmail());
            if (existingEmailUser != null) {
                throw new RuntimeException("该邮箱已被占用");
            }
            user.setEmail(request.getEmail());
            }
            
        userRepository.save(user);
    }


    public void sendResetCode(String email){
        //第一步：确认邮箱对应的用户存在
        User user = userRepository.findByEmail(email);
        if(user == null){
            throw new RuntimeException("邮箱未注册,请检查后重试");
        }

        //第二步：生成6位随机验证码
        String code = String.format("%06d",new Random().nextInt(999999));

        //第三步：将验证码存入Redis，设置5分钟过期
        String redisKey = "RESET_CODE:"+email;
        stringRedisTemplate.opsForValue().set(redisKey,code,5,TimeUnit.MINUTES);

        //第四步：调用spring mail发送验证码邮件
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("【HelloWisdom】密码重置验证码");
        message.setText("您正在进行密码重置操作，验证码为："+code+"，请在5分钟内使用。若非本人操作，请忽略此邮件。");

        mailSender.send(message);
    }

    //验证重置验证码
    public void resetPassword(String email,String code,String newPassword){
        String redisKey = "RESET_CODE:" + email;
        String saveCode = stringRedisTemplate.opsForValue().get(redisKey);

        //第一步：验证验证码是否正确
        if (saveCode == null || !saveCode.equals(code)) {
            throw new RuntimeException("验证码错误或已过期");
        }
        //第二步：找到对应用户并更新密码
        User user = userRepository.findByEmail(email);
        if(user == null){
            throw new RuntimeException("邮箱未注册,请检查后重试");
        }

        user.setPassword(BCrypt.hashpw(newPassword,BCrypt.gensalt()));
        userRepository.save(user);

        //第三步：删除Redis中的验证码
        stringRedisTemplate.delete(redisKey);
    }

}
