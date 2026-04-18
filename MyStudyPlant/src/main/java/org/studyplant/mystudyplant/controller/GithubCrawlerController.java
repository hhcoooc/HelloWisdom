package org.studyplant.mystudyplant.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.studyplant.mystudyplant.task.GithubCrawlerTask;

/**
 * 爬虫手动触发控制器
 */
@RestController
@RequestMapping("/api/crawler")
public class GithubCrawlerController {

    @Autowired
    private GithubCrawlerTask githubCrawlerTask;

    /**
     * 通过浏览器或 Postman 访问这个接口来手动触发爬虫
     */
    @GetMapping("/start")
    public String startCrawler() {
        if (githubCrawlerTask.isRunning()) {
            return "爬虫任务已经在运行中了，不要重复启动～";
        }
        // 调用异步任务
        githubCrawlerTask.fetchAndGenerateArticles();
        
        return "启动成功！爬虫引擎已被唤醒，正在后台异步运行，请查看后端控制台日志以确认进度。";
    }

    /**
     * 紧急刹车：请求此接口以停止后台爬虫任务
     */
    @GetMapping("/stop")
    public String stopCrawler() {
        if (!githubCrawlerTask.isRunning()) {
            return "当前没有正在运行的爬虫任务。";
        }
        githubCrawlerTask.stopCrawler();
        return "已发送【停止】指令！爬虫将在完成当前手上未完的一篇文章后，立刻退出队列休眠。";
    }

    /**
     * 查看爬虫当下正在干什么
     */
    @GetMapping("/status")
    public String statusCrawler() {
        return githubCrawlerTask.isRunning() 
                ? " 状态：运行中 (Running)" 
                : " 状态：已停止 (Stopped/Idle)";
    }
}