package org.studyplant.mystudyplant.common;

public class Result<T> {
    private int code;
    private String msg;
    private T data;

        private Result (int code, String msg, T data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
    }

    public static <T> Result<T> success(String msg, T data) {
        return new Result<> (200, msg, data);
    }

    public static <T> Result<T> success(String msg) {
        return new Result<> (200, msg, null);
    }

    public static <T> Result<T> error(int code, String msg) {
        return new Result<> (code, msg, null);
    }

    // getter 方法（必须要有，否则 JSON 序列化失败）
    public int getCode() { return code; }
    public String getMsg() { return msg; }
    public T getData() { return data; }
}

