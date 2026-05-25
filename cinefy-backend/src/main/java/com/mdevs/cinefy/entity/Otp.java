package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.OtpType;
import com.mdevs.cinefy.entity.enums.UserType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = {
        @Index(columnList = "USER_ID, USER_TYPE"),
        @Index(columnList = "EXPIRATION_DATE"),
        @Index(columnList = "CODE, TYPE")
})
public class Otp extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OtpType type;

    @Column(nullable = false, columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime expirationDate;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserType userType;
}
