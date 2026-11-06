package com.travel.service;

import com.travel.dao.ReviewDao;
import com.travel.dao.SpotDao;
import com.travel.dto.AdminReviewDTO;
import com.travel.dto.ReviewDTO;
import com.travel.model.AppUser;
import com.travel.model.Review;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 评价业务：
 *   - 公开浏览某景区评价；
 *   - 登录用户发布/更新自己的评价（被封禁用户不可发）；
 *   - 删除评价：仅作者本人或管理员；
 *   - 后台：列出全部评价、管理员删除任意评价。
 */
@Service
public class ReviewService {

    private final ReviewDao reviewDao;
    private final SpotDao spotDao;
    private final AuthService authService;

    public ReviewService(ReviewDao reviewDao, SpotDao spotDao, AuthService authService) {
        this.reviewDao = reviewDao;
        this.spotDao = spotDao;
        this.authService = authService;
    }

    public List<ReviewDTO> listBySpot(String spotId) {
        return reviewDao.findBySpotId(spotId).stream().map(this::toDTO).toList();
    }

    /** 发布或更新当前登录用户对某景区的评价。 */
    public ReviewDTO save(String token, String spotId, Integer rating, String content) {
        AppUser user = authService.resolveUserByToken(token);
        if (user == null) {
            throw new AuthService.AuthException("请先登录后再评价");
        }
        if (user.isBanned()) {
            throw new AuthService.AuthException(AuthService.banMessage(user));
        }
        String id = spotId == null ? "" : spotId.trim();
        if (id.isEmpty() || spotDao.findById(id) == null) {
            throw new AuthService.AuthException("景区不存在，无法评价");
        }
        int value = rating == null ? 0 : rating;
        if (value < 1 || value > 5) {
            throw new AuthService.AuthException("请选择 1–5 分的评分");
        }
        String text = content == null ? "" : content.trim();
        if (text.length() > 500) {
            throw new AuthService.AuthException("文字评价最多 500 字");
        }
        reviewDao.upsert(id, user.getUsernameKey(), user.getUsername(), value, text);
        Review saved = reviewDao.findBySpotAndUser(id, user.getUsernameKey());
        if (saved == null) {
            throw new AuthService.AuthException("评价保存失败，请稍后再试");
        }
        return toDTO(saved);
    }

    /** 删除评价：作者本人或管理员可删。 */
    public void deleteById(String token, Long reviewId) {
        AppUser user = authService.resolveUserByToken(token);
        if (user == null) {
            throw new AuthService.AuthException("请先登录");
        }
        Review review = reviewDao.findById(reviewId);
        if (review == null) {
            throw new AuthService.AuthException("评价不存在或已被删除");
        }
        boolean isAuthor = review.getUsernameKey() != null
                && review.getUsernameKey().equalsIgnoreCase(user.getUsernameKey());
        if (!isAuthor && !user.isAdmin()) {
            throw new AuthService.AuthException("只能删除自己的评价");
        }
        reviewDao.deleteById(reviewId);
    }

    public List<AdminReviewDTO> listAllForAdmin(String adminToken) {
        authService.requireAdmin(adminToken);
        return reviewDao.findAllForAdmin();
    }

    public void deleteForAdmin(String adminToken, Long reviewId) {
        authService.requireAdmin(adminToken);
        if (reviewId == null) {
            throw new AuthService.AuthException("评价不存在");
        }
        if (reviewDao.deleteById(reviewId) == 0) {
            throw new AuthService.AuthException("评价不存在或已被删除");
        }
    }

    private ReviewDTO toDTO(Review r) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(r.getId());
        dto.setSpotId(r.getSpotId());
        dto.setUsername(r.getUsername());
        dto.setRating(r.getRating());
        dto.setContent(r.getContent());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());
        return dto;
    }
}
