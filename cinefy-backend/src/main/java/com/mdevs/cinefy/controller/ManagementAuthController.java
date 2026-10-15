package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.config.AppConfig;
import com.mdevs.cinefy.dto.auth.ForgotPasswordDTO;
import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.OtpCodeDTO;
import com.mdevs.cinefy.dto.auth.ResetPasswordDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.entity.enums.UserType;
import com.mdevs.cinefy.service.JwtSessionService;
import com.mdevs.cinefy.service.ManagementAuthService;
import com.mdevs.cinefy.shared.exception.types.UnauthorizedException;
import com.mdevs.cinefy.shared.security.AuthContext;
import com.mdevs.cinefy.shared.security.AuthCookieResponseFactory;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import com.mdevs.cinefy.shared.annotation.RateLimited;
import com.mdevs.cinefy.shared.ratelimit.RateLimitPolicy;
import com.mdevs.cinefy.utils.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/management/auth")
@RequiredArgsConstructor
public class ManagementAuthController {

    private final ManagementAuthService managementAuthService;

    private final JwtSessionService jwtSessionService;

    private final AuthCookieResponseFactory authCookieResponseFactory;

    private static final String AUTH_PATH = AppConfig.getBaseUrl() + "/management/auth";

    private static final AuthContext AUTH_CONTEXT = AuthContext.MANAGEMENT;

    private static final AuthContext POPULATOR_AUTH_CONTEXT = AuthContext.POPULATOR;

    @PublicApi
    @RateLimited(RateLimitPolicy.STRICT)
    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody LoginDTO dto) {
        TokenPairDTO tokens = managementAuthService.login(dto);
        return authCookieResponseFactory.tokenResponse(AUTH_CONTEXT, tokens, AUTH_PATH);
    }

    @PublicApi
    @RateLimited(RateLimitPolicy.STRICT)
    @PostMapping("/populator-login")
    public ResponseEntity<Void> populatorLogin(@Valid @RequestBody LoginDTO dto) {
        TokenPairDTO tokens = managementAuthService.populatorLogin(dto);
        return authCookieResponseFactory.tokenResponse(POPULATOR_AUTH_CONTEXT, tokens, AUTH_PATH);
    }

    @PublicApi
    @GetMapping("/session")
    public ResponseEntity<Void> session(HttpServletRequest request) {
        AuthContext authContext = resolveStaffAuthContext(request);
        String refreshToken = CookieUtil.readCookie(request, authContext.refreshTokenCookie());
        boolean valid = jwtSessionService.isRefreshTokenValid(refreshToken);
        return valid ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PublicApi
    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request) {
        AuthContext authContext = resolveStaffAuthContext(request);
        String refreshToken = CookieUtil.readCookie(request, authContext.refreshTokenCookie());
        TokenPairDTO tokens = jwtSessionService.refresh(refreshToken);
        return authCookieResponseFactory.tokenResponse(authContext, tokens, AUTH_PATH);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        AuthContext authContext = resolveStaffAuthContext(request);
        String accessToken = CookieUtil.readCookie(request, authContext.accessTokenCookie());
        String refreshToken = CookieUtil.readCookie(request, authContext.refreshTokenCookie());
        jwtSessionService.logout(accessToken, refreshToken);
        return authCookieResponseFactory.logoutResponse(authContext, AUTH_PATH);
    }

    @PublicApi
    @RateLimited(RateLimitPolicy.STRICT)
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordDTO dto) {
        managementAuthService.forgotPassword(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/verify-reset-code")
    public ResponseEntity<Void> verifyResetCode(@Valid @RequestBody OtpCodeDTO dto) {
        managementAuthService.verifyResetCode(dto);
        return ResponseEntity.noContent().build();
    }

    @PublicApi
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordDTO dto) {
        managementAuthService.resetPassword(dto);
        return ResponseEntity.noContent().build();
    }

    // =========================== Helpers ===========================

    private AuthContext resolveStaffAuthContext(HttpServletRequest request) {
        AuthContext authContext = AuthContext.fromHeader(request.getHeader(AuthContext.HEADER));
        if (authContext == null || authContext.getUserType() != UserType.STAFF_MEMBER) {
            throw new UnauthorizedException("Unable to verify your session. Please log in again");
        }
        return authContext;
    }
}
