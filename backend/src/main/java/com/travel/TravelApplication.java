package com.travel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 贵州旅游项目后端启动类。
 * 负责：用户注册 / 登录 / 会话校验 / 后台用户管理，数据持久化到 MySQL tourism_database。
 */
@SpringBootApplication
public class TravelApplication {
    public static void main(String[] args) {
        SpringApplication.run(TravelApplication.class, args);
    }

    /** 统一的密码哈希器，AuthService 与种子管理员初始化共用。 */
    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
