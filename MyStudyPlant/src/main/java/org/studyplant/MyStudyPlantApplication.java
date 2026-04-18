package org.studyplant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;


@EnableCaching
@EnableScheduling
@SpringBootApplication
@EnableAsync
public class MyStudyPlantApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyStudyPlantApplication.class, args);
    }

}
