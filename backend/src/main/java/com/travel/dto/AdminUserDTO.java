package com.travel.dto;

import java.time.LocalDateTime;

/**
 * 后台用户管理列表中的单条用户记录（不含密码等敏感字段）。
 */
public class AdminUserDTO {
    private Long id;
    private String username;
    private String usernameKey;
    private String role;
    private String status;
    private String banReason;
    private LocalDateTime bannedAt;
    private String bannedBy;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getUsernameKey() { return usernameKey; }
    public void setUsernameKey(String usernameKey) { this.usernameKey = usernameKey; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getBanReason() { return banReason; }
    public void setBanReason(String banReason) { this.banReason = banReason; }
    public LocalDateTime getBannedAt() { return bannedAt; }
    public void setBannedAt(LocalDateTime bannedAt) { this.bannedAt = bannedAt; }
    public String getBannedBy() { return bannedBy; }
    public void setBannedBy(String bannedBy) { this.bannedBy = bannedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
