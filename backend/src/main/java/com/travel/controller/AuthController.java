package com.travel.controller;

import com.travel.dto.ApiResponse;
import com.travel.dto.AuthRequest;
import com.travel.dto.UserDTO;
import com.travel.service.AuthService;
import org.springframework.web.bind.annotation.*;

/**
 * 登录注册接口。
 *   POST /api/auth/register  {username, password}
 *   POST /api/auth/login     {username, password}
 *   GET  /api/auth/me?token=xxx
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<UserDTO> register(@RequestBody AuthRequest req) {
        try {
            UserDTO dto = authService.register(req.getUsername(), req.getPassword());
            return ApiResponse.ok(dto);
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ApiResponse<UserDTO> login(@RequestBody AuthRequest req) {
        try {
            UserDTO dto = authService.login(req.getUsername(), req.getPassword());
            return ApiResponse.ok(dto);
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ApiResponse<UserDTO> me(@RequestParam(value = "token", required = false) String token) {
        try {
            UserDTO dto = authService.me(token);
            if (dto == null) {
                return ApiResponse.fail("未登录或登录已过期");
            }
            return ApiResponse.ok(dto);
        } catch (AuthService.AuthException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
