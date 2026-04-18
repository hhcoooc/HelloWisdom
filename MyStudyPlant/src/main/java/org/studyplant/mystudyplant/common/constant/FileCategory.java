package org.studyplant.mystudyplant.common.constant;

import java.io.File;

public enum FileCategory {
    AVATAR("public/avatars/"),//头像公开
    ARTICLE_IMAGE("public/articles/"),//文章图片公开
    COMMENT_IMAGE("public/comments/"), // 新增评论图片分类
    DRAFT_ATTACHMENT("private/drafts/"),//草稿附件私密
    COMMENT_TEMP("private/comments/temp/");// 临时评论图片（私有）

    private final String prefix;

    FileCategory(String prefix){
        this.prefix = prefix;
    }

    public String getPrefix(){
        return prefix;
    }
}
