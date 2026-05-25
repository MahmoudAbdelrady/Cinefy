package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.PaymentMethodStatus;
import com.mdevs.cinefy.entity.enums.PaymentMethodTestStatus;
import com.mdevs.cinefy.entity.enums.PaymentMethodType;
import com.mdevs.cinefy.entity.enums.PaymentProvider;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = {
        @Index(columnList = "CREATED_AT"),
        @Index(columnList = "TYPE"),
        @Index(columnList = "STATUS"),
        @Index(columnList = "TYPE, STATUS")
})
public class PaymentMethod extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodStatus status = PaymentMethodStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodType type;

    @Column(nullable = false)
    private boolean isTest = false;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String secretKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String hmacKey;

    @Column(nullable = false)
    private String publicKey;

    @Column(nullable = false)
    private long integrationId;

    @Column(length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodTestStatus testStatus = PaymentMethodTestStatus.UNTESTED;

    @Column(columnDefinition = "TEXT")
    private String testFailureReason;

    @Column(columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime testedAt;

    @Column(columnDefinition = "TIMESTAMP(0)", nullable = false)
    private LocalDateTime credentialsRotatedAt;
}
