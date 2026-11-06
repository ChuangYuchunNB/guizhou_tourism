package com.travel.config;

import com.travel.dao.UserDao;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * 种子管理员：首次启动时若不存在管理员账号，则创建一个。
 * 账号 / 密码可通过环境变量 ADMIN_USERNAME / ADMIN_PASSWORD 覆盖，默认 admin / admin123。
 * 必须在 SchemaMigrator 之后执行（@Order(2) > @Order(1)），确保 role 列已存在。
 */
@Component
@Order(2)
public class DataInitializer implements CommandLineRunner {

    private final UserDao userDao;
    private final BCryptPasswordEncoder encoder;

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    public DataInitializer(UserDao userDao, BCryptPasswordEncoder encoder) {
        this.userDao = userDao;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        String key = adminUsername.trim().toLowerCase(Locale.ROOT);
        if (key.isEmpty()) {
            return;
        }
        if (userDao.findByUsernameKey(key) != null) {
            return; // 已存在，不覆盖（不重置密码，避免破坏用户已改的密码）
        }
        userDao.insertUserWithRole(adminUsername.trim(), key, encoder.encode(adminPassword), "ADMIN");
    }
}
