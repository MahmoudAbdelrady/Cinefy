package com.mdevs.cinefy.filter;

import com.mdevs.cinefy.service.InvalidJwtService;
import com.mdevs.cinefy.shared.security.AuthContext;
import com.mdevs.cinefy.shared.security.JwtClaims;
import com.mdevs.cinefy.shared.security.JwtUtil;
import com.mdevs.cinefy.shared.security.UserPrincipal;
import com.mdevs.cinefy.utils.CookieUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    private final InvalidJwtService invalidJwtService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        AuthContext context = AuthContext.fromHeader(request.getHeader(AuthContext.HEADER));

        if (context == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = CookieUtil.readCookie(request, context.accessTokenCookie());

        if (StringUtils.isNotEmpty(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
            authenticate(token, context);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(String token, AuthContext context) {
        try {
            Claims claims = jwtUtil.parseToken(token).getPayload();
            if (invalidJwtService.isBlocklisted(claims.getId())) {
                SecurityContextHolder.clearContext();
                return;
            }

            JwtClaims jwtClaims = JwtClaims.from(claims);
            if (!jwtClaims.userType().equals(context.getUserType())) {
                SecurityContextHolder.clearContext();
                return;
            }

            UserPrincipal principal = UserPrincipal.fromJwtClaims(jwtClaims);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
        }
    }
}
