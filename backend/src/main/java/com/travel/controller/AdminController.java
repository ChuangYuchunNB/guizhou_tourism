package com.travel.controller;

import com.travel.dto.AdminReviewDTO;
import com.travel.dto.AdminUserDTO;
import com.travel.dto.ApiResponse;
import com.travel.dto.BanRequest;
import com.travel.dto.SpotRequest;
import com.travel.model.Spot;
import com.travel.service.AdminService;
import com.travel.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 后台管理接口（仅管理员可用）：
 *   用户：GET /users、POST /users/{key}/ban、POST /users/{key}/unban
 *   景点：GET /spots、POST /spots、DELETE /spots/{id}
 *   评价：GET /reviews、DELETE /reviews/{id}
 * token 通过查询参数 ?token= 或请求头 X-Token 传入。
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ApiResponse<List<AdminUserDTO>> users(
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "X-Token", required = false) String headerToken) {
        try {
            return ApiResponse.ok(adminService.listUsers(resolveToken(token, headerToken)));
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/users/{usernameKey}/ban")
    public ApiResponse<Void> ban(
            @PathVariable String usernameKey,
            @RequestBody(required = false) BanRequest req,
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "X-Token", required = false) String headerToken) {
        try {
            adminService.banUser(resolveToken(token, headerToken), usernameKey,
                    req == null ? null : req.getReason());
            return ApiResponse.ok(null);
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/users/{usernameKey}/unban")
    public ApiResponse<Void> unban(
            @PathVariable String usernameKey,
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "X-Token", required = false) String headerToken) {
        try {
            adminService.unbanUser(resolveToken(token, headerToken), usernameKey);
            return ApiResponse.ok(null);
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    // ---------- 景点管理 ----------

    @GetMapping("/spots")
    public ApiResponse<List<Spot>> spots(
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "X-Token", required = false) String headerToken) {
        try {
            return ApiResponse.ok(adminService.listSpots(resolveToken(token, headerToken)));
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/spots")
    public ApiResponse<Spot> createSpot(
            @RequestBody(required = false) SpotRequest req,
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "X-Token", required = false) String headerToken) {
        try {
            return ApiResponse.ok(adminService.createSpot(resolveToken(token, headerToken), req));
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @DeleteMapping("/spots/{id}")
    public ApiResponse<Void> deleteSpot(
            @PathVariable String id,
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "X-Token", required = false) String headerToken) {
        try {
            adminService.deleteSpot(resolveToken(token, headerToken), id);
            return ApiResponse.ok(null);
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    // ---------- 评价管理 ----------

    @GetMapping("/reviews")
    public ApiResponse<List<AdminReviewDTO>> reviews(
            @RequestParam(value = "token", required = false) String token,
            @RequestHeader(value = "X-Token", required = false) String headerToken) {
        try {
            return ApiResponse.ok(adminService.listReviews(resolveToken(token, headerToken)));
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
            adminService.deleteReview(resolveToken(token, headerToken), id);
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
