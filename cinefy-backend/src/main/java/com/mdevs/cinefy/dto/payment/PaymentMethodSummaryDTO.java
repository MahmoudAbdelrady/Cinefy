package com.mdevs.cinefy.dto.payment;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    @Getter(onMethod_ = @JsonProperty("isTest"))
    @Setter(onMethod_ = @JsonProperty("isTest"))
    private boolean isTest;

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
