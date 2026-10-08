package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.shared.security.TokenType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = {
        @Index(columnList = "EXPIRATION_DATE")
})
public class InvalidJwt extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String jti;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TokenType type;

    @Column(nullable = false, columnDefinition = "TIMESTAMPTZ(0)")
    private Instant expirationDate;
}
