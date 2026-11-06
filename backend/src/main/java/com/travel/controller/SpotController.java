package com.travel.controller;

import com.travel.dto.ApiResponse;
import com.travel.dto.ReviewDTO;
import com.travel.dto.ReviewRequest;
import com.travel.model.Spot;
import com.travel.service.AuthService;
import com.travel.service.ReviewService;
import com.travel.service.SpotService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 景区与评价公开接口：
 *   GET    /api/spots                  全部景区
 *   GET    /api/spots/{id}             单个景区
 *   GET    /api/spots/{id}/reviews     某景区的真实用户评价
 *   POST   /api/spots/{id}/reviews     发布/更新评价（需登录，body: {rating, content}）
 *   DELETE /api/reviews/{id}           删除评价（作者本人或管理员）
 * token 通过查询参数 ?token= 或请求头 X-Token 传入。
 */
@RestController
@RequestMapping("/api")
public class SpotController {

    private final SpotService spotService;
    private final ReviewService reviewService;

    public SpotController(SpotService spotService, ReviewService reviewService) {
        this.spotService = spotService;
        this.reviewService = reviewService;
    }

    @GetMapping("/spots")
    public ApiResponse<List<Spot>> spots() {
        return ApiResponse.ok(spotService.listAll());
    }

    @GetMapping("/spots/{id}")
    public ApiResponse<Spot> spot(@PathVariable String id) {
        Spot spot = spotService.getById(id);
        if (spot == null) {
            return ApiResponse.fail("景区不存在");
        }
        return ApiResponse.ok(spot);
    }

    @GetMapping("/spots/{id}/reviews")
    public ApiResponse<List<ReviewDTO>> reviews(@PathVariable String id) {
        return ApiResponse.ok(reviewService.listBySpot(id));
    }

    @PostMapping("/spots/{id}/reviews")
    public ApiResponse<ReviewDTO> addReview(
            @PathVariable String id,
            @RequestBody(required = false) ReviewRequest req,
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "X-Token", required = false) String headerToken) {
        try {
            ReviewDTO dto = reviewService.save(
                    resolveToken(token, headerToken), id,
                    req == null ? null : req.getRating(),
                    req == null ? null : req.getContent());
            return ApiResponse.ok(dto);
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @DeleteMapping("/reviews/{id}")
    public ApiResponse<Void> deleteReview(
            @PathVariable Long id,
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "X-Token", required = false) String headerToken) {
        try {
            reviewService.deleteById(resolveToken(token, headerToken), id);
            return ApiResponse.ok(null);
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    private String resolveToken(String queryToken, String headerToken) {
        if (headerToken != null && !headerToken.trim().isEmpty()) {
            return headerToken.trim();
        }
        return queryToken;
    }
}
