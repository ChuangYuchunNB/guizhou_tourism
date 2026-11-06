package com.travel.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 景区实体（spot 表）。tags / highlights / colors 以 JSON 字符串存库，
 * 由 DAO 层用 ObjectMapper 与 List<String> 互转，前端拿到的已是数组。
 */
public class Spot {
    private String id;
    private String heroImage;
    private String name;
    private String level;
    private double rating;
    private int ratingCount;
    private String city;
    private String area;
    private List<String> tags;
    private String summary;
    private String intro;
    private List<String> highlights;
    private String bestSeason;
    private String duration;
    private String ticket;
    private String address;
    private String emoji;
    private List<String> colors;
    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getHeroImage() { return heroImage; }
    public void setHeroImage(String heroImage) { this.heroImage = heroImage; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public int getRatingCount() { return ratingCount; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getIntro() { return intro; }
    public void setIntro(String intro) { this.intro = intro; }
    public List<String> getHighlights() { return highlights; }
    public void setHighlights(List<String> highlights) { this.highlights = highlights; }
    public String getBestSeason() { return bestSeason; }
    public void setBestSeason(String bestSeason) { this.bestSeason = bestSeason; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public String getTicket() { return ticket; }
    public void setTicket(String ticket) { this.ticket = ticket; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
    public List<String> getColors() { return colors; }
    public void setColors(List<String> colors) { this.colors = colors; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
