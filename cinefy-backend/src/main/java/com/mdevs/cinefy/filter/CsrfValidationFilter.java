package com.mdevs.cinefy.filter;

import com.mdevs.cinefy.shared.exception.CinefyExceptionResponse;
import com.mdevs.cinefy.shared.security.CsrfProtectionMatcher;
import com.mdevs.cinefy.shared.security.SecurityUtil;
import com.mdevs.cinefy.utils.CookieUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
@RequiredArgsConstructor
public class CsrfValidationFilter extends OncePerRequestFilter {

    private final CsrfProtectionMatcher csrfProtectionMatcher;

    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (SecurityUtil.isAuthenticated() && csrfProtectionMatcher.matches(request) && !isCsrfTokenValid(request)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), new CinefyExceptionResponse("Invalid CSRF token", null, null));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isCsrfTokenValid(HttpServletRequest request) {
        String cookieToken = CookieUtil.readCookie(request, CsrfProtectionMatcher.CSRF_TOKEN_COOKIE);
        String headerToken = request.getHeader(CsrfProtectionMatcher.CSRF_TOKEN_HEADER);

        if (StringUtils.isEmpty(cookieToken) || StringUtils.isEmpty(headerToken)) {
            return false;
        }
        // Constant-time comparison to avoid leaking the token via timing side-channels.
        return MessageDigest.isEqual(cookieToken.getBytes(StandardCharsets.UTF_8), headerToken.getBytes(StandardCharsets.UTF_8));
    }
}
