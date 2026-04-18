package org.studyplant.mystudyplant.common.holder;

public class UserContextHolder {
    private static final ThreadLocal<Long> CONTEXT = new ThreadLocal<>();

    public static void setUserId(Long userId) { CONTEXT.set(userId); }
    public static Long getUserId() { return CONTEXT.get(); }
    public static void clear() { CONTEXT.remove(); }
}