package org.studyplant.mystudyplant.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;
import org.studyplant.mystudyplant.common.Result;

import cn.dev33.satoken.exception.NotLoginException;
import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 拦截业务异常（Service层抛出的 RuntimeException）
    @ExceptionHandler(RuntimeException.class)
    public Result<Void> handleRuntimeException(RuntimeException e){
        // 这一类异常通常是我们在代码里主动 throw 的，比如 "用户不存在"，所以直接返回 400 和它的 message
        log.warn("业务异常: {}", e.getMessage());
        return Result.error(400, e.getMessage());
    }

    //拦截未登录异常
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    @ExceptionHandler(NotLoginException.class)
    public Result<Void> handleNotLoginException(NotLoginException e){
        log.warn("未登录访问: {}", e.getMessage());
        return Result.error(401, "请先登录");
    }

    //兜底异常：处理所有未知的系统异常
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e){
        log.error("系统异常: ", e);
        return Result.error(500, "系统异常，请稍后再试");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return Result.error(400, message);
    }

    @ExceptionHandler(BindException.class)
    public Result handleBindException(BindException e) {
        String message = e.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return Result.error(400, message);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public Result handleConstraintViolationException(ConstraintViolationException e) {
            // 可以取第一个 violation 的消息
        String message = e.getConstraintViolations().iterator().next().getMessage();
        return Result.error(400, message);
    }

    
}
