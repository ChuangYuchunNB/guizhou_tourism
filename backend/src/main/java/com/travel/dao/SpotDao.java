package com.travel.dao;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.model.Spot;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/** 景区数据访问层。tags / highlights / colors 以 JSON 字符串存库。 */
@Repository
public class SpotDao {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public SpotDao(JdbcTemplate jdbc, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    private final RowMapper<Spot> mapper = (rs, rowNum) -> {
        Spot s = new Spot();
        s.setId(rs.getString("id"));
        s.setHeroImage(rs.getString("hero_image"));
        s.setName(rs.getString("name"));
        s.setLevel(rs.getString("level"));
        s.setRating(rs.getDouble("rating"));
        s.setRatingCount(rs.getInt("rating_count"));
        s.setCity(rs.getString("city"));
        s.setArea(rs.getString("area"));
        s.setTags(parseList(rs, "tags"));
        s.setSummary(rs.getString("summary"));
        s.setIntro(rs.getString("intro"));
        s.setHighlights(parseList(rs, "highlights"));
        s.setBestSeason(rs.getString("best_season"));
        s.setDuration(rs.getString("duration"));
        s.setTicket(rs.getString("ticket"));
        s.setAddress(rs.getString("address"));
        s.setEmoji(rs.getString("emoji"));
        s.setColors(parseColors(rs));
        Timestamp ts = rs.getTimestamp("created_at");
        s.setCreatedAt(ts == null ? null : ts.toLocalDateTime());
        return s;
    };

    private List<String> parseList(ResultSet rs, String col) throws SQLException {
        String raw = rs.getString(col);
        if (raw == null || raw.isEmpty()) return Collections.emptyList();
        try {
            return objectMapper.readValue(raw, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<String> parseColors(ResultSet rs) throws SQLException {
        String c1 = rs.getString("color1");
        String c2 = rs.getString("color2");
        if (c1 == null || c1.isEmpty()) return Collections.emptyList();
        return c2 == null || c2.isEmpty() ? List.of(c1) : List.of(c1, c2);
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    public List<Spot> findAll() {
        return jdbc.query(
                "SELECT id, hero_image, name, level, rating, rating_count, city, area, tags, summary, " +
                        "intro, highlights, best_season, duration, ticket, address, emoji, color1, color2, created_at " +
                        "FROM spot ORDER BY rating DESC, id ASC",
                mapper);
    }

    public Spot findById(String id) {
        List<Spot> list = jdbc.query(
                "SELECT id, hero_image, name, level, rating, rating_count, city, area, tags, summary, " +
                        "intro, highlights, best_season, duration, ticket, address, emoji, color1, color2, created_at " +
                        "FROM spot WHERE id = ? LIMIT 1",
                mapper, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public int count() {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM spot", Integer.class);
        return n == null ? 0 : n;
    }

    public int insert(Spot s) {
        String c1 = s.getColors() != null && !s.getColors().isEmpty() ? s.getColors().get(0) : null;
        String c2 = s.getColors() != null && s.getColors().size() > 1 ? s.getColors().get(1) : null;
        return jdbc.update(
                "INSERT INTO spot (id, hero_image, name, level, rating, rating_count, city, area, tags, summary, " +
                        "intro, highlights, best_season, duration, ticket, address, emoji, color1, color2) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                s.getId(), s.getHeroImage(), s.getName(), s.getLevel(), s.getRating(), s.getRatingCount(),
                s.getCity(), s.getArea(), toJson(s.getTags()), s.getSummary(), s.getIntro(),
                toJson(s.getHighlights()), s.getBestSeason(), s.getDuration(), s.getTicket(),
                s.getAddress(), s.getEmoji(), c1, c2);
    }

    public int deleteById(String id) {
        return jdbc.update("DELETE FROM spot WHERE id = ?", id);
    }
}
