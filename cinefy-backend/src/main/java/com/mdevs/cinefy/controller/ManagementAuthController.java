package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.auth.ManagementLoginDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.service.ManagementAuthService;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import com.mdevs.cinefy.utils.CookieUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/management/auth")
@RequiredArgsConstructor
public class ManagementAuthController {

    private final ManagementAuthService managementAuthService;

    private final CookieUtil cookieUtil;

    @Value("${cinefy.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${cinefy.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    @PublicApi
    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody ManagementLoginDTO dto) {
        TokenPairDTO tokens = managementAuthService.login(dto);

        ResponseCookie accessTokenCookie = cookieUtil.buildTokenCookie(JwtUtil.ACCESS_TOKEN_COOKIE, tokens.accessToken(), accessTokenExpiration, false);
        ResponseCookie refreshTokenCookie = cookieUtil.buildTokenCookie(JwtUtil.REFRESH_TOKEN_COOKIE, tokens.refreshToken(), refreshTokenExpiration, true);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .build();
    }

    @PublicApi
    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(@CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE) String refreshToken) {
        TokenPairDTO tokens = managementAuthService.refresh(refreshToken);

        ResponseCookie accessTokenCookie = cookieUtil.buildTokenCookie(JwtUtil.ACCESS_TOKEN_COOKIE, tokens.accessToken(), accessTokenExpiration, false);
        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());

        if (tokens.refreshToken() != null) {
            ResponseCookie refreshTokenCookie = cookieUtil.buildTokenCookie(JwtUtil.REFRESH_TOKEN_COOKIE, tokens.refreshToken(), refreshTokenExpiration, true);
            responseBuilder.header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
        }

        return responseBuilder.build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(value = JwtUtil.ACCESS_TOKEN_COOKIE) String accessToken,
                                       @CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE) String refreshToken) {
        managementAuthService.logout(accessToken, refreshToken);

        ResponseCookie clearedAccessTokenCookie = cookieUtil.buildTokenCookie(JwtUtil.ACCESS_TOKEN_COOKIE, "", 0, false);
        ResponseCookie clearedRefreshTokenCookie = cookieUtil.buildTokenCookie(JwtUtil.REFRESH_TOKEN_COOKIE, "", 0, true);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearedAccessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearedRefreshTokenCookie.toString())
                .build();
    }
}
