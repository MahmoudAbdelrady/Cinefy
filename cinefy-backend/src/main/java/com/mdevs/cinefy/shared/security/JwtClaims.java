package com.mdevs.cinefy.shared.security;

import com.mdevs.cinefy.entity.enums.UserType;
import io.jsonwebtoken.Claims;

public record JwtClaims(String uuid, UserType userType, String position) {

    public static JwtClaims from(Claims claims) {
        return new JwtClaims(
                claims.getSubject(),
                UserType.valueOf(claims.get(JwtUtil.CLAIM_USER_TYPE, String.class)),
                claims.get(JwtUtil.CLAIM_POSITION, String.class));
    }

    public static JwtClaims fromPrincipal(UserPrincipal principal) {
        return new JwtClaims(principal.getUuid(), principal.getType(), principal.getPosition());
    }
}
