package com.mdevs.cinefy.entity;

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
        @Index(columnList = "_UUID")
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

    @Column
    private String iframeId;

    @Column(length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethodTestStatus testStatus = PaymentMethodTestStatus.UNTESTED;

    @Column(columnDefinition = "TEXT")
    private String testFailureReason;

    @Column(columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime testedAt;

    @Column(columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime publishedAt;

    @Column(columnDefinition = "TIMESTAMP(0)")
    private LocalDateTime credentialsRotatedAt;
}
