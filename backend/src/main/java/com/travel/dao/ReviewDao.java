package com.travel.dao;

import com.travel.dto.AdminReviewDTO;
import com.travel.model.Review;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/** 用户评价数据访问层。 */
@Repository
public class ReviewDao {

    private final JdbcTemplate jdbc;

    public ReviewDao(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Review> MAPPER = (rs, rowNum) -> {
        Review r = new Review();
        r.setId(rs.getLong("id"));
        r.setSpotId(rs.getString("spot_id"));
        r.setUsernameKey(rs.getString("username_key"));
        r.setUsername(rs.getString("username"));
        r.setRating(rs.getInt("rating"));
        r.setContent(rs.getString("content"));
        Timestamp c = rs.getTimestamp("created_at");
        r.setCreatedAt(c == null ? null : c.toLocalDateTime());
        Timestamp u = rs.getTimestamp("updated_at");
        r.setUpdatedAt(u == null ? null : u.toLocalDateTime());
        return r;
    };

    private static final RowMapper<AdminReviewDTO> ADMIN_MAPPER = (rs, rowNum) -> {
        AdminReviewDTO r = new AdminReviewDTO();
        r.setId(rs.getLong("id"));
        r.setSpotId(rs.getString("spot_id"));
        r.setSpotName(rs.getString("spot_name"));
        r.setUsername(rs.getString("username"));
        r.setRating(rs.getInt("rating"));
        r.setContent(rs.getString("content"));
        Timestamp c = rs.getTimestamp("created_at");
        r.setCreatedAt(c == null ? null : c.toLocalDateTime());
        Timestamp u = rs.getTimestamp("updated_at");
        r.setUpdatedAt(u == null ? null : u.toLocalDateTime());
        return r;
    };

    /** 某景区的全部真实评价，最新优先。 */
    public List<Review> findBySpotId(String spotId) {
        return jdbc.query(
                "SELECT id, spot_id, username_key, username, rating, content, created_at, updated_at " +
                        "FROM review WHERE spot_id = ? ORDER BY updated_at DESC, id DESC",
                MAPPER, spotId);
    }

    /** 后台用：全部评价（含景区名），最新优先。 */
    public List<AdminReviewDTO> findAllForAdmin() {
        return jdbc.query(
                "SELECT r.id, r.spot_id, COALESCE(s.name, r.spot_id) AS spot_name, " +
                        "r.username, r.rating, r.content, r.created_at, r.updated_at " +
                        "FROM review r LEFT JOIN spot s ON s.id = r.spot_id " +
                        "ORDER BY r.created_at DESC, r.id DESC",
                ADMIN_MAPPER);
    }

    public Review findById(Long id) {
        List<Review> list = jdbc.query(
                "SELECT id, spot_id, username_key, username, rating, content, created_at, updated_at " +
                        "FROM review WHERE id = ? LIMIT 1",
                MAPPER, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public Review findBySpotAndUser(String spotId, String usernameKey) {
        List<Review> list = jdbc.query(
                "SELECT id, spot_id, username_key, username, rating, content, created_at, updated_at " +
                        "FROM review WHERE spot_id = ? AND username_key = ? LIMIT 1",
                MAPPER, spotId, usernameKey);
        return list.isEmpty() ? null : list.get(0);
    }

    /** 新增或更新某用户对某景区的评价（唯一键冲突时更新）。 */
    public int upsert(String spotId, String usernameKey, String username, int rating, String content) {
        return jdbc.update(
                "INSERT INTO review (spot_id, username_key, username, rating, content) VALUES (?, ?, ?, ?, ?) " +
                        "ON DUPLICATE KEY UPDATE rating = VALUES(rating), content = VALUES(content), username = VALUES(username)",
                spotId, usernameKey, username, rating, content);
    }

    public int deleteById(Long id) {
        return jdbc.update("DELETE FROM review WHERE id = ?", id);
    }

    public int deleteBySpotId(String spotId) {
        return jdbc.update("DELETE FROM review WHERE spot_id = ?", spotId);
    }
}
