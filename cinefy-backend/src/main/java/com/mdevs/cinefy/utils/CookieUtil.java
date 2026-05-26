package com.mdevs.cinefy.utils;

import com.mdevs.cinefy.shared.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieUtil {

    private static final String ROOT_PATH = "/";

    private static final String AUTH_PATH = "/management/auth";

    @Value("${cinefy.cookie.secure}")
    private boolean secure;

    @Value("${cinefy.cookie.same-site}")
    private String sameSite;

    public ResponseCookie buildAccessTokenCookie(String value, long expirationMs) {
        return build(JwtUtil.ACCESS_TOKEN_COOKIE, value, expirationMs, false, ROOT_PATH);
    }

    public ResponseCookie buildRefreshTokenCookie(String value, long expirationMs) {
        return build(JwtUtil.REFRESH_TOKEN_COOKIE, value, expirationMs, true, AUTH_PATH);
    }

    private ResponseCookie build(String name, String value, long expirationMs, boolean httpOnly, String path) {
        return ResponseCookie.from(name, value)
                .httpOnly(httpOnly)
                .secure(secure)
                .path(path)
                .sameSite(sameSite)
                .maxAge(Duration.ofMillis(expirationMs))
                .build();
    }
}
