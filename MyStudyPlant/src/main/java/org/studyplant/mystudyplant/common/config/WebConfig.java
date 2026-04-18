package org.studyplant.mystudyplant.common.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.studyplant.mystudyplant.common.converter.StringToFileCategoryConverter;
import org.studyplant.mystudyplant.common.holder.UserContextInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private StringToFileCategoryConverter stringToFileCategoryConverter;

    @Autowired
    private UserContextInterceptor userContextInterceptor;  // 新增注入

    @Override
    public void addFormatters(FormatterRegistry registry){
        registry.addConverter(stringToFileCategoryConverter);
    }

    // 新增拦截器注册
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(userContextInterceptor)
                .addPathPatterns("/**");  // 拦截所有请求
        
        // 注册 Sa-Token 的全局拦截器
        registry.addInterceptor(new SaInterceptor()).addPathPatterns("/**");
    }

    // 新增跨域配置
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*") // 允许所有来源（推荐在生产环境指定具体域名）
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
    
}
