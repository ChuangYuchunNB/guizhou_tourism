package com.travel.dao;

import com.travel.dto.AdminUserDTO;
import com.travel.model.AppUser;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户与会话的数据访问层（JdbcTemplate）。
 */
@Repository
public class UserDao {

    private final JdbcTemplate jdbc;

    private static final RowMapper<AppUser> USER_MAPPER = (rs, rowNum) -> {
        AppUser u = new AppUser();
        u.setId(rs.getLong("id"));
        u.setUsername(rs.getString("username"));
        u.setUsernameKey(rs.getString("username_key"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setRole(rs.getString("role"));
        u.setStatus(rs.getString("status"));
        u.setBanReason(rs.getString("ban_reason"));
        Timestamp b = rs.getTimestamp("banned_at");
        u.setBannedAt(b == null ? null : b.toLocalDateTime());
        u.setBannedBy(rs.getString("banned_by"));
        Timestamp ts = rs.getTimestamp("created_at");
        u.setCreatedAt(ts == null ? null : ts.toLocalDateTime());
        return u;
    };

    private static final RowMapper<AdminUserDTO> ADMIN_USER_MAPPER = (rs, rowNum) -> {
        AdminUserDTO u = new AdminUserDTO();
        u.setId(rs.getLong("id"));
        u.setUsername(rs.getString("username"));
        u.setUsernameKey(rs.getString("username_key"));
        u.setRole(rs.getString("role"));
        u.setStatus(rs.getString("status"));
        u.setBanReason(rs.getString("ban_reason"));
        Timestamp b = rs.getTimestamp("banned_at");
        u.setBannedAt(b == null ? null : b.toLocalDateTime());
        u.setBannedBy(rs.getString("banned_by"));
        Timestamp ts = rs.getTimestamp("created_at");
        u.setCreatedAt(ts == null ? null : ts.toLocalDateTime());
        return u;
    };

    public UserDao(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AppUser findByUsernameKey(String usernameKey) {
        List<AppUser> list = jdbc.query(
                "SELECT id, username, username_key, password_hash, role, status, ban_reason, banned_at, banned_by, created_at " +
                        "FROM app_user WHERE username_key = ? LIMIT 1",
                USER_MAPPER, usernameKey);
        return list.isEmpty() ? null : list.get(0);
    }

    /** 普通注册：角色默认 USER（由数据库 DEFAULT 提供）。 */
    public int insertUser(String username, String usernameKey, String passwordHash) {
        return insertUserWithRole(username, usernameKey, passwordHash, "USER");
    }

    /** 指定角色插入（用于种子管理员）。 */
    public int insertUserWithRole(String username, String usernameKey, String passwordHash, String role) {
        return jdbc.update(
                "INSERT INTO app_user (username, username_key, password_hash, role, status) VALUES (?, ?, ?, ?, 'ACTIVE')",
                username, usernameKey, passwordHash, role);
    }

    /** 后台用户列表：按注册时间倒序，不含密码字段。 */
    public List<AdminUserDTO> findAllForAdmin() {
        return jdbc.query(
                "SELECT id, username, username_key, role, status, ban_reason, banned_at, banned_by, created_at " +
                        "FROM app_user ORDER BY created_at DESC, id DESC",
                ADMIN_USER_MAPPER);
    }

    /**
     * 更新封禁状态。封禁时 status=BANNED 并写入理由/时间/执行人；解封时 status=ACTIVE 并清空封禁字段。
     * 返回受影响行数（0 表示目标用户不存在）。
     */
    public int updateBanStatus(String usernameKey, String status, String reason, String bannedBy, LocalDateTime bannedAt) {
        return jdbc.update(
                "UPDATE app_user SET status = ?, ban_reason = ?, banned_at = ?, banned_by = ? WHERE username_key = ?",
                status, reason, bannedAt == null ? null : Timestamp.valueOf(bannedAt), bannedBy, usernameKey);
    }

    public int insertSession(String token, String usernameKey) {
        return jdbc.update(
                "INSERT INTO user_session (token, username_key) VALUES (?, ?)",
                token, usernameKey);
    }

    /** 返回该 token 对应的 username_key，不存在则返回 null。 */
    public String findSessionUsernameKey(String token) {
        List<String> list = jdbc.query(
                "SELECT username_key FROM user_session WHERE token = ? LIMIT 1",
                (rs, rowNum) -> rs.getString("username_key"), token);
        return list.isEmpty() ? null : list.get(0);
    }
}
