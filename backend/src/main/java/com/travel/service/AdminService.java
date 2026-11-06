package com.travel.service;

import com.travel.dao.ReviewDao;
import com.travel.dao.SpotDao;
import com.travel.dao.UserDao;
import com.travel.dto.AdminReviewDTO;
import com.travel.dto.AdminUserDTO;
import com.travel.dto.SpotRequest;
import com.travel.model.AppUser;
import com.travel.model.Spot;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 后台管理业务：用户封禁/解封、景点增删、评价删除。所有操作均校验调用者为管理员。
 */
@Service
public class AdminService {

    private static final Pattern SPOT_ID_PATTERN = Pattern.compile("^[a-z0-9-]{2,64}$");
    private static final List<String> ALLOWED_LEVELS = List.of("5A", "4A", "3A");

    private final UserDao userDao;
    private final SpotDao spotDao;
    private final ReviewDao reviewDao;
    private final ReviewService reviewService;
    private final AuthService authService;

    public AdminService(UserDao userDao, SpotDao spotDao, ReviewDao reviewDao,
                        ReviewService reviewService, AuthService authService) {
        this.userDao = userDao;
        this.spotDao = spotDao;
        this.reviewDao = reviewDao;
        this.reviewService = reviewService;
        this.authService = authService;
    }

    // ---------- 用户管理 ----------

    public List<AdminUserDTO> listUsers(String adminToken) {
        authService.requireAdmin(adminToken);
        return userDao.findAllForAdmin();
    }

    public void banUser(String adminToken, String targetUsernameKey, String reason) {
        AppUser admin = authService.requireAdmin(adminToken);
        String key = AuthService.usernameKey(targetUsernameKey);
        if (key.isEmpty()) {
            throw new AuthService.AuthException("目标用户不存在");
        }
        AppUser target = userDao.findByUsernameKey(key);
        if (target == null) {
            throw new AuthService.AuthException("目标用户不存在");
        }
        if (key.equals(admin.getUsernameKey())) {
            throw new AuthService.AuthException("不能封禁你自己");
        }
        if (target.isAdmin()) {
            throw new AuthService.AuthException("不能封禁管理员账号");
        }
        String note = reason == null ? "" : reason.trim();
        if (note.isEmpty()) {
            throw new AuthService.AuthException("请填写封禁理由，以便告知被封禁用户");
        }
        if (note.length() > 255) {
            throw new AuthService.AuthException("封禁理由最多 255 字");
        }
        int rows = userDao.updateBanStatus(key, "BANNED", note, admin.getUsername(), LocalDateTime.now());
        if (rows == 0) {
            throw new AuthService.AuthException("封禁失败，目标用户不存在");
        }
    }

    public void unbanUser(String adminToken, String targetUsernameKey) {
        AppUser admin = authService.requireAdmin(adminToken);
        String key = AuthService.usernameKey(targetUsernameKey);
        if (key.isEmpty()) {
            throw new AuthService.AuthException("目标用户不存在");
        }
        AppUser target = userDao.findByUsernameKey(key);
        if (target == null) {
            throw new AuthService.AuthException("目标用户不存在");
        }
        if (target.isAdmin()) {
            throw new AuthService.AuthException("不能操作管理员账号");
        }
        int rows = userDao.updateBanStatus(key, "ACTIVE", null, null, null);
        if (rows == 0) {
            throw new AuthService.AuthException("解封失败，目标用户不存在");
        }
    }

    // ---------- 景点管理 ----------

    public List<Spot> listSpots(String adminToken) {
        authService.requireAdmin(adminToken);
        return spotDao.findAll();
    }

    public Spot createSpot(String adminToken, SpotRequest req) {
        authService.requireAdmin(adminToken);
        if (req == null) {
            throw new AuthService.AuthException("请求参数为空");
        }
        String id = req.getId() == null ? "" : req.getId().trim().toLowerCase(Locale.ROOT);
        if (!SPOT_ID_PATTERN.matcher(id).matches()) {
            throw new AuthService.AuthException("景区标识需为 2–64 位小写字母、数字或连字符（如 xiaoqikong）");
        }
        if (spotDao.findById(id) != null) {
            throw new AuthService.AuthException("该景区标识已存在，请换一个");
        }
        String name = req.getName() == null ? "" : req.getName().trim();
        if (name.isEmpty() || name.length() > 100) {
            throw new AuthService.AuthException("请填写景区名称（不超过 100 字）");
        }
        String level = req.getLevel() == null ? "" : req.getLevel().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_LEVELS.contains(level)) {
            throw new AuthService.AuthException("景区等级需为 5A / 4A / 3A");
        }
        String city = req.getCity() == null ? "" : req.getCity().trim();
        if (city.isEmpty()) {
            throw new AuthService.AuthException("请填写所在城市");
        }

        Spot spot = new Spot();
        spot.setId(id);
        spot.setName(name);
        spot.setLevel(level);
        spot.setCity(city);
        spot.setHeroImage(trimOrNull(req.getHeroImage()));
        spot.setArea(trimOrNull(req.getArea()));
        spot.setSummary(trimOrNull(req.getSummary()));
        spot.setIntro(req.getIntro());
        spot.setBestSeason(trimOrNull(req.getBestSeason()));
        spot.setDuration(trimOrNull(req.getDuration()));
        spot.setTicket(trimOrNull(req.getTicket()));
        spot.setAddress(trimOrNull(req.getAddress()));
        spot.setEmoji(trimOrNull(req.getEmoji()));
        spot.setTags(req.getTags() == null ? List.of() : req.getTags());
        spot.setHighlights(req.getHighlights() == null ? List.of() : req.getHighlights());
        spot.setColors(req.getColors() == null || req.getColors().isEmpty()
                ? List.of("#0d5c4d", "#4ade80") : req.getColors());
        spot.setRating(req.getRating() == null ? 0 : req.getRating());
        spot.setRatingCount(req.getRatingCount() == null ? 0 : req.getRatingCount());

        spotDao.insert(spot);
        Spot created = spotDao.findById(id);
        if (created == null) {
            throw new AuthService.AuthException("新增景区失败，请稍后再试");
        }
        return created;
    }

    public void deleteSpot(String adminToken, String id) {
        authService.requireAdmin(adminToken);
        String key = id == null ? "" : id.trim();
        if (key.isEmpty() || spotDao.findById(key) == null) {
            throw new AuthService.AuthException("景区不存在或已被删除");
        }
        // 先删该景区的评价，再删景区
        reviewDao.deleteBySpotId(key);
        spotDao.deleteById(key);
    }

    // ---------- 评价管理 ----------

    public List<AdminReviewDTO> listReviews(String adminToken) {
        return reviewService.listAllForAdmin(adminToken);
    }

    public void deleteReview(String adminToken, Long reviewId) {
        reviewService.deleteForAdmin(adminToken, reviewId);
    }

    private static String trimOrNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
