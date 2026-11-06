package com.travel.dto;

import java.time.LocalDateTime;

/**
 * 登录 / 注册成功后返回给前端的用户信息 + 会话令牌。
 */
public class UserDTO {
    private String username;
    private LocalDateTime createdAt;
    private String token;
    private String role;   // USER / ADMIN

    public UserDTO() {}

    public UserDTO(String username, LocalDateTime createdAt, String token) {
        this.username = username;
        this.createdAt = createdAt;
        this.token = token;
    }

    public UserDTO(String username, LocalDateTime createdAt, String token, String role) {
        this.username = username;
        this.createdAt = createdAt;
        this.token = token;
        this.role = role;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
