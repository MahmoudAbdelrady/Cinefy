package com.mdevs.cinefy.shared.security;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtil {

    private SecurityUtil() {
    }

    public static boolean isAuthenticated() {
        return isAuthenticated(SecurityContextHolder.getContext().getAuthentication());
    }

    public static boolean isAuthenticated(Authentication auth) {
        return auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken);
    }

    public static UserPrincipal getCurrentUser() {
        Object principal = Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .map(Authentication::getPrincipal)
                .orElse(null);
        return principal instanceof UserPrincipal userPrincipal ? userPrincipal : null;
    }

    public static String getCurrentUserUuid() {
        UserPrincipal user = getCurrentUser();
        return user == null ? null : user.getUuid();
    }
}
