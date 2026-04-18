package org.studyplant.mystudyplant.common;

import java.util.List;

import org.springframework.data.domain.Page;

public class PageResult<T>{
    private List<T> list;
    private long total;
    private int totalPages;
    private int currentPage;
    private int pageSize;

    //重写构造器
    public PageResult(List<T> list,long total , int totalPages, int currentPage,int pageSize){
        this.list = list;
        this.total = total;
        this.totalPages = totalPages;
        this.currentPage = currentPage;
        this.pageSize = pageSize;
    } 

    
    // ✅ 新增：更优雅的静态工厂方法，从 Spring Data JPA 的 Page 对象快速构建
    public static <T> PageResult<T> of(Page<T> page) {
        return new PageResult<>(
            page.getContent(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.getNumber() + 1, // JPA 的 Page 对象中的页码是从 0 开始的，通常返回给前端时我们按 1 算起，根据你自己此前的设定适配
            page.getSize()
        );
    }

    public List<T> getList() { return list; }
    public long getTotal() { return total; }
    public int getTotalPages() { return totalPages; }
    public int getCurrentPage() { return currentPage; }
    public int getPageSize() { return pageSize; }
}