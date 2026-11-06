package com.travel.dto;

/** 发布/更新评价请求体。 */
public class ReviewRequest {
    private Integer rating;
    private String content;

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
