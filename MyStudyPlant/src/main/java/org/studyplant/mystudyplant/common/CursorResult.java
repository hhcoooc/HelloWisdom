package org.studyplant.mystudyplant.common;

import java.util.List;

import lombok.Data;

@Data
public class CursorResult<T> {
    private List<T> data;
    private Long nextCursor; // 下一页的游标（最后一篇文章的ID），为null表示无更多数据

    public CursorResult(List<T> data, Long nextCursor) {
        this.data = data;
        this.nextCursor = nextCursor;
    }
    
}
