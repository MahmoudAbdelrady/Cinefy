package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.auth.ForgotPasswordDTO;
import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.OtpCodeDTO;
import com.mdevs.cinefy.dto.auth.ResetPasswordDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.dto.client.SignUpDTO;
import com.mdevs.cinefy.service.ClientAuthService;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.utils.CookieUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/clients/auth")
@RequiredArgsConstructor
public class ClientAuthController {

    private final ClientAuthService clientAuthService;

    private final CookieUtil cookieUtil;

    @Value("${cinefy.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${cinefy.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    private static final String AUTH_PATH = "/clients/auth";

    @PublicApi
    @PostMapping("/sign-up")
    public ResponseEntity<Void> signUp(@Valid @RequestBody SignUpDTO dto) {
        clientAuthService.signUp(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PublicApi
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
        clientAuthService.forgotPassword(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/verify-reset-code")
    public ResponseEntity<Void> verifyResetCode(@Valid @RequestBody OtpCodeDTO dto) {
        clientAuthService.verifyResetCode(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        clientAuthService.resetPassword(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/verify")
    public ResponseEntity<Void> verify(@Valid @RequestBody OtpCodeDTO dto) {
        TokenPairDTO tokens = clientAuthService.verifyClient(dto);
        return authCookieResponse(tokens);
    }

    @PublicApi
    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody LoginDTO dto) {
        TokenPairDTO tokens = clientAuthService.login(dto);
        return authCookieResponse(tokens);
    }

    @PublicApi
    @GetMapping("/session")
    public ResponseEntity<Void> session(@CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE, required = false) String refreshToken) {
        boolean valid = clientAuthService.isRefreshTokenValid(refreshToken);
        return valid ? ResponseEntity.ok().build() : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PublicApi
    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(@CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE, required = false) String refreshToken) {
        TokenPairDTO tokens = clientAuthService.refresh(refreshToken);

        ResponseCookie accessTokenCookie = cookieUtil.buildAccessTokenCookie(tokens.accessToken(), accessTokenExpiration);
        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());

        if (StringUtils.isNotEmpty(tokens.refreshToken())) {
            ResponseCookie refreshTokenCookie = cookieUtil.buildRefreshTokenCookie(tokens.refreshToken(), refreshTokenExpiration, AUTH_PATH);
            ResponseCookie csrfTokenCookie = cookieUtil.buildCsrfTokenCookie(UUID.randomUUID().toString(), refreshTokenExpiration);
            responseBuilder.header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
            responseBuilder.header(HttpHeaders.SET_COOKIE, csrfTokenCookie.toString());
        }

        return responseBuilder.build();
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(value = JwtUtil.ACCESS_TOKEN_COOKIE) String accessToken,
                                       @CookieValue(value = JwtUtil.REFRESH_TOKEN_COOKIE) String refreshToken) {
        clientAuthService.logout(accessToken, refreshToken);

        ResponseCookie clearedAccessTokenCookie = cookieUtil.buildAccessTokenCookie("", 0);
        ResponseCookie clearedRefreshTokenCookie = cookieUtil.buildRefreshTokenCookie("", 0, AUTH_PATH);
        ResponseCookie clearedCsrfTokenCookie = cookieUtil.buildCsrfTokenCookie("", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearedAccessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearedRefreshTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearedCsrfTokenCookie.toString())
                .build();
    }

    private ResponseEntity<Void> authCookieResponse(TokenPairDTO tokens) {
        ResponseCookie accessTokenCookie = cookieUtil.buildAccessTokenCookie(tokens.accessToken(), accessTokenExpiration);
        ResponseCookie refreshTokenCookie = cookieUtil.buildRefreshTokenCookie(tokens.refreshToken(), refreshTokenExpiration, AUTH_PATH);
        ResponseCookie csrfTokenCookie = cookieUtil.buildCsrfTokenCookie(UUID.randomUUID().toString(), refreshTokenExpiration);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, csrfTokenCookie.toString())
                .build();
    }
}
