package com.travel.model;

import java.time.LocalDateTime;

/** 用户评价实体（review 表）。每个用户对每个景区最多一条（spot_id + username_key 唯一）。 */
public class Review {
    private Long id;
    private String spotId;
    private String usernameKey;
    private String username;
    private int rating;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSpotId() { return spotId; }
    public void setSpotId(String spotId) { this.spotId = spotId; }
    public String getUsernameKey() { return usernameKey; }
    public void setUsernameKey(String usernameKey) { this.usernameKey = usernameKey; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
