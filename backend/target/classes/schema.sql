-- 用户表（注册信息持久化）
CREATE TABLE IF NOT EXISTS app_user (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL COMMENT '显示用户名',
    username_key  VARCHAR(50)  NOT NULL COMMENT '小写归一化用户名，用于唯一校验',
    password_hash VARCHAR(100) NOT NULL COMMENT 'BCrypt 哈希',
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER' COMMENT '角色：USER 普通用户 / ADMIN 管理员',
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT '状态：ACTIVE 正常 / BANNED 已封禁',
    ban_reason    VARCHAR(255) NULL     COMMENT '封禁理由（向被封禁用户说明）',
    banned_at     DATETIME     NULL     COMMENT '封禁时间',
    banned_by     VARCHAR(50)  NULL     COMMENT '执行封禁的管理员用户名',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_username_key (username_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 登录会话表（token 持久化，后端重启不失效）
CREATE TABLE IF NOT EXISTS user_session (
    id           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    token        VARCHAR(64) NOT NULL,
    username_key VARCHAR(50) NOT NULL,
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_token (token),
    KEY idx_username_key (username_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 景区表（后台可增删；首次启动由 spots-seed.json 种子 20 个示例景区）
CREATE TABLE IF NOT EXISTS spot (
    id           VARCHAR(64)  NOT NULL PRIMARY KEY COMMENT '景区标识（URL 友好，如 huangguoshu）',
    hero_image   VARCHAR(255) NULL COMMENT '封面图路径',
    name         VARCHAR(100) NOT NULL COMMENT '景区名称',
    level        VARCHAR(10)  NOT NULL COMMENT '等级：5A / 4A / 3A',
    rating       DECIMAL(3,1) NOT NULL DEFAULT 0 COMMENT '基础评分',
    rating_count INT          NOT NULL DEFAULT 0 COMMENT '基础评分人数',
    city         VARCHAR(50)  NOT NULL COMMENT '所在市/州',
    area         VARCHAR(100) NULL COMMENT '所在区县',
    tags         TEXT         NULL COMMENT '标签 JSON 数组',
    summary      VARCHAR(500) NULL COMMENT '一句话简介',
    intro        TEXT         NULL COMMENT '详细介绍',
    highlights   TEXT         NULL COMMENT '亮点 JSON 数组',
    best_season  VARCHAR(100) NULL COMMENT '最佳季节',
    duration     VARCHAR(50)  NULL COMMENT '建议游玩时长',
    ticket       VARCHAR(100) NULL COMMENT '参考票价',
    address      VARCHAR(200) NULL COMMENT '地址',
    emoji        VARCHAR(16)  NULL COMMENT '图标 emoji',
    color1       VARCHAR(20)  NULL COMMENT '主题色 1',
    color2       VARCHAR(20)  NULL COMMENT '主题色 2',
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户评价表（每个用户对每个景区最多一条）
CREATE TABLE IF NOT EXISTS review (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    spot_id       VARCHAR(64)  NOT NULL COMMENT '所属景区 id',
    username_key  VARCHAR(50)  NOT NULL COMMENT '评价用户归一化名',
    username      VARCHAR(50)  NOT NULL COMMENT '评价用户显示名',
    rating        INT          NOT NULL COMMENT '评分 1-5',
    content       VARCHAR(500) NULL COMMENT '文字评价',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_spot_user (spot_id, username_key),
    KEY idx_spot (spot_id),
    KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
