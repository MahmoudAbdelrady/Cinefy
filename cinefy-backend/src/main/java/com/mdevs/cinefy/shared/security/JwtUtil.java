package com.mdevs.cinefy.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    public static final String CLAIM_POSITION = "position";

    public static final String CLAIM_TYPE = "type";

    public static final String CLAIM_USER_TYPE = "userType";

    private final SecretKey secretKey;

    @Value("${cinefy.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${cinefy.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public JwtUtil(@Value("${cinefy.jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret));
    }

    public String generateToken(TokenType tokenType, JwtClaims jwtClaims) {
        long now = System.currentTimeMillis();
        long expiration = tokenType.equals(TokenType.ACCESS) ? accessTokenExpiration : refreshTokenExpiration;
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(jwtClaims.uuid())
                .claim(CLAIM_POSITION, jwtClaims.position())
                .claim(CLAIM_TYPE, tokenType.name())
                .claim(CLAIM_USER_TYPE, jwtClaims.userType().name())
                .issuedAt(new Date(now))
                .expiration(new Date(now + expiration))
                .signWith(secretKey)
                .compact();
    }

    public Jws<Claims> parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
    }

    public TokenType getTokenType(Claims claims) {
        return TokenType.valueOf(claims.get(CLAIM_TYPE, String.class));
    }

    public LocalDateTime getExpiration(Claims claims) {
        return LocalDateTime.ofInstant(claims.getExpiration().toInstant(), ZoneId.systemDefault());
    }

    public long getRemainingValidity(Claims claims) {
        return claims.getExpiration().getTime() - System.currentTimeMillis();
    }
}
