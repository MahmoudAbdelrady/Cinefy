package com.mdevs.cinefy.filter;

import com.mdevs.cinefy.shared.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String token = extractAccessToken(request);

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            authenticate(token);
        }

        filterChain.doFilter(request, response);
    }

    private String extractAccessToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        return Arrays.stream(cookies).filter(cookie -> JwtUtil.ACCESS_TOKEN_COOKIE.equals(cookie.getName()))
                .findFirst().map(Cookie::getValue).orElse(null);
    }

    private void authenticate(String token) {
        try {
            Claims claims = jwtUtil.parseToken(token).getPayload();
            String uuid = claims.getSubject();
            String position = claims.get(JwtUtil.CLAIM_POSITION, String.class);

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    uuid, null, List.of(new SimpleGrantedAuthority("ROLE_" + position)));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException ex) {
            SecurityContextHolder.clearContext();
        }
    }
}
