package org.studyplant.mystudyplant.common.server;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import jakarta.websocket.*;

import cn.dev33.satoken.stp.StpUtil;
import jakarta.websocket.server.ServerEndpoint;
import jakarta.websocket.server.PathParam;

@Component
@ServerEndpoint("/notification/{token}")
public class NotificationWebSocketServer {
    //用来记录当前在线用户的session
    private static final ConcurrentHashMap<Long, Session> sessionMap = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session,@PathParam("token") String token){
        try{
            //通过token 使用SaToken获取用户ID
            Object loginId = StpUtil.getLoginIdByToken(token);
            if (loginId != null) {
                Long userId = Long.valueOf(loginId.toString());
                sessionMap.put(userId, session);
                System.out.println(">>>WS 连接成功,用户ID:" + userId);
            } else {
                session.close();//如果token无效，关闭连接
            }
        }catch(Exception e){
            System.err.println("WS 连接失败: " + e.getMessage());
        }
    }
    @OnClose
    public void onClose(Session session){
        //遍历删除掉线的用户
        sessionMap.entrySet().removeIf(entry -> entry.getValue().getId().equals(session.getId()));
    }

    @OnError
    public void onError(Session session, Throwable error){
        System.err.println("WS 连接错误: " + error.getMessage());
    }

    //核心静态方法：向指定用户发送消息
    public static void sendMessageToUser(Long userId, String message) {
        Session session = sessionMap.get(userId);
        if (session != null && session.isOpen()) {
            try {
                session.getBasicRemote().sendText(message);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
