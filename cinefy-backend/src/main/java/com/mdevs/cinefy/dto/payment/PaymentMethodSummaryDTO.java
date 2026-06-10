package com.mdevs.cinefy.dto.payment;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
public class PaymentMethodSummaryDTO {

    private String id;

    private String name;

    private String status;

    private String type;

    private boolean isTestMode;

    private String currency;

    private String publicKey;

    private String secretKeyHint;

    private String hmacKeyHint;

    private long integrationId;

    private String testStatus;

    private String testFailureReason;

    private LocalDateTime testedAt;

    private String successRate;

    private LocalDateTime credentialsRotatedAt;

    private LocalDateTime createdAt;
}
