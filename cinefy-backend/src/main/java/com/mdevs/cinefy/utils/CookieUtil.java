package com.mdevs.cinefy.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class CookieUtil {

    @Value("${cinefy.cookie.secure}")
    private boolean secure;

    @Value("${cinefy.cookie.same-site}")
    private String sameSite;

    public ResponseCookie buildTokenCookie(String name, String value, long expirationMs, boolean httpOnly) {
        return ResponseCookie.from(name, value)
                .httpOnly(httpOnly)
                .secure(secure)
                .path("/")
                .sameSite(sameSite)
                .maxAge(Duration.ofMillis(expirationMs))
                .build();
    }
}
