package com.travel.dto;

/**
 * 封禁请求体：必须携带封禁理由（会告知被封禁用户）。
 */
public class BanRequest {
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
