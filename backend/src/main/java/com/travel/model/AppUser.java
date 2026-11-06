package com.travel.model;

import java.time.LocalDateTime;

/**
 * app_user 表对应的用户实体（内部使用，不直接返回给前端）。
 */
public class AppUser {
    private Long id;
    private String username;
    private String usernameKey;
    private String passwordHash;
    private String role;          // USER / ADMIN
    private String status;        // ACTIVE / BANNED
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
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
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

    public boolean isAdmin() { return "ADMIN".equalsIgnoreCase(role); }
    public boolean isBanned() { return "BANNED".equalsIgnoreCase(status); }
}
