package com.mdevs.cinefy.controller;

import com.mdevs.cinefy.dto.auth.ForgotPasswordDTO;
import com.mdevs.cinefy.dto.auth.LoginDTO;
import com.mdevs.cinefy.dto.auth.OtpCodeDTO;
import com.mdevs.cinefy.dto.auth.ResetPasswordDTO;
import com.mdevs.cinefy.dto.auth.TokenPairDTO;
import com.mdevs.cinefy.service.JwtSessionService;
import com.mdevs.cinefy.service.ManagementAuthService;
import com.mdevs.cinefy.shared.security.AuthContext;
import com.mdevs.cinefy.shared.security.AuthCookieResponseFactory;
import com.mdevs.cinefy.shared.annotation.PublicApi;
import com.mdevs.cinefy.utils.CookieUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Locale;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/management/auth")
@RequiredArgsConstructor
public class ManagementAuthController {

    private final ManagementAuthService managementAuthService;

    private final JwtSessionService jwtSessionService;

    private final AuthCookieResponseFactory authCookieResponseFactory;

    private static final String AUTH_PATH = "/management/auth";

    private static final AuthContext AUTH_CONTEXT = AuthContext.MANAGEMENT;

    private static final Set<String> SENSITIVE_HEADERS = Set.of("cookie", "authorization", "x-xsrf-token");

    @PublicApi
    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody LoginDTO dto) {
        TokenPairDTO tokens = managementAuthService.login(dto);
        return authCookieResponseFactory.tokenResponse(AUTH_CONTEXT, tokens, AUTH_PATH);
    }

    @PublicApi
    @GetMapping("/session")
    public ResponseEntity<Void> session(HttpServletRequest request) {
        logRequestDetails(request);
        String refreshToken = CookieUtil.readCookie(request, AUTH_CONTEXT.refreshTokenCookie());
        boolean valid = jwtSessionService.isRefreshTokenValid(refreshToken);
        return valid ? ResponseEntity.noContent().build() : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PublicApi
    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request) {
        String refreshToken = CookieUtil.readCookie(request, AUTH_CONTEXT.refreshTokenCookie());
        TokenPairDTO tokens = jwtSessionService.refresh(refreshToken);
        return authCookieResponseFactory.tokenResponse(AUTH_CONTEXT, tokens, AUTH_PATH);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String accessToken = CookieUtil.readCookie(request, AUTH_CONTEXT.accessTokenCookie());
        String refreshToken = CookieUtil.readCookie(request, AUTH_CONTEXT.refreshTokenCookie());
        jwtSessionService.logout(accessToken, refreshToken);
        return authCookieResponseFactory.logoutResponse(AUTH_CONTEXT, AUTH_PATH);
    }

    @PublicApi
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

    private void logRequestDetails(HttpServletRequest request) {
        StringBuilder details = new StringBuilder("Session request details:")
                .append("\n  method: ").append(request.getMethod())
                .append("\n  url: ").append(request.getRequestURL())
                .append("\n  uri: ").append(request.getRequestURI())
                .append("\n  query: ").append(request.getQueryString())
                .append("\n  scheme: ").append(request.getScheme())
                .append("\n  secure: ").append(request.isSecure())
                .append("\n  host: ").append(request.getServerName()).append(':').append(request.getServerPort())
                .append("\n  remote address: ").append(request.getRemoteAddr())
                .append("\n  headers:");

        for (String name : Collections.list(request.getHeaderNames())) {
            for (String value : Collections.list(request.getHeaders(name))) {
                String shownValue = SENSITIVE_HEADERS.contains(name.toLowerCase(Locale.ROOT))
                        ? "[redacted, " + value.length() + " chars]"
                        : value;
                details.append("\n    ").append(name).append(": ").append(shownValue);
            }
        }

        details.append("\n  cookies:");
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            details.append(" none");
        } else {
            for (Cookie cookie : cookies) {
                details.append("\n    ").append(cookie.getName()).append(" (").append(cookie.getValue().length()).append(" chars)");
            }
        }

        log.info(details.toString());
    }
}
