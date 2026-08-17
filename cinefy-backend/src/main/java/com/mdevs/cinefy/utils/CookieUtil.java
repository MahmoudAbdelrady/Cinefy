package com.mdevs.cinefy.utils;

import com.mdevs.cinefy.shared.oauth.OAuthProviderClient;
import com.mdevs.cinefy.shared.security.CsrfProtectionMatcher;
import com.mdevs.cinefy.shared.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;

@Component
public class CookieUtil {

    private static final String ROOT_PATH = "/";

    @Value("${cinefy.cookie.secure}")
    private boolean secure;

    @Value("${cinefy.cookie.same-site}")
    private String sameSite;

    public static String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        return Arrays.stream(cookies).filter(cookie -> name.equals(cookie.getName()))
                .findFirst().map(Cookie::getValue).orElse(null);
    }

    public ResponseCookie buildAccessTokenCookie(String value, long expirationMs) {
        return build(JwtUtil.ACCESS_TOKEN_COOKIE, value, expirationMs, true, ROOT_PATH);
    }

    public ResponseCookie buildRefreshTokenCookie(String value, long expirationMs, String path) {
        return build(JwtUtil.REFRESH_TOKEN_COOKIE, value, expirationMs, true, path);
    }

    public ResponseCookie buildCsrfTokenCookie(String value, long expirationMs) {
        return build(CsrfProtectionMatcher.CSRF_TOKEN_COOKIE, value, expirationMs, false, ROOT_PATH);
    }

    public ResponseCookie buildOAuthStateCookie(String value, long expirationMs) {
        return build(OAuthProviderClient.OAUTH_STATE_COOKIE, value, expirationMs, true, ROOT_PATH);
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
