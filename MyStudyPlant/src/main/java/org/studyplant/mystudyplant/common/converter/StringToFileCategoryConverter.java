package org.studyplant.mystudyplant.common.converter;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;
import org.studyplant.mystudyplant.common.constant.FileCategory;

@Component
public class StringToFileCategoryConverter implements Converter<String,FileCategory>{
    @Override
    public FileCategory convert(String source){
        //将小写加下划线转换为大写枚举名
    return FileCategory.valueOf(source.toUpperCase());
    }
    
}
