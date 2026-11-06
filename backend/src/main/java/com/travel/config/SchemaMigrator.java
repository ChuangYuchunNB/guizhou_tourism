package com.travel.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 幂等的表结构迁移：兼容在本次功能上线前就已存在的 app_user 旧表。
 * schema.sql 只对全新库生效（CREATE TABLE IF NOT EXISTS 不会改旧表），
 * 这里通过 information_schema 判断缺失列并补齐，重复执行无副作用。
 * 必须在 DataInitializer 之前执行（@Order(1) < @Order(2)）。
 */
@Component
@Order(1)
public class SchemaMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    public SchemaMigrator(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        Set<String> existing = new HashSet<>(jdbc.queryForList(
                "SELECT column_name FROM information_schema.columns " +
                        "WHERE table_schema = DATABASE() AND table_name = 'app_user'",
                String.class));

        addColumnIfMissing(existing, "role",
                "ALTER TABLE app_user ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '角色：USER / ADMIN' AFTER password_hash");
        addColumnIfMissing(existing, "status",
                "ALTER TABLE app_user ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE / BANNED' AFTER role");
        addColumnIfMissing(existing, "ban_reason",
                "ALTER TABLE app_user ADD COLUMN ban_reason VARCHAR(255) NULL COMMENT '封禁理由' AFTER status");
        addColumnIfMissing(existing, "banned_at",
                "ALTER TABLE app_user ADD COLUMN banned_at DATETIME NULL COMMENT '封禁时间' AFTER ban_reason");
        addColumnIfMissing(existing, "banned_by",
                "ALTER TABLE app_user ADD COLUMN banned_by VARCHAR(50) NULL COMMENT '封禁执行人' AFTER banned_at");
    }

    private void addColumnIfMissing(Set<String> existing, String column, String ddl) {
        if (existing.contains(column)) {
            return;
        }
        jdbc.execute(ddl);
        existing.add(column);
    }
}
