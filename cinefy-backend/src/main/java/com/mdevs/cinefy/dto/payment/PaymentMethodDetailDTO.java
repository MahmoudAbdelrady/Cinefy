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
public class PaymentMethodDetailDTO {

    private String id;

    private String name;

    private String type;

    private String currency;

    private String publicKey;

    private long integrationId;

    private String testStatus;

    private String testFailureReason;

    private LocalDateTime testedAt;
}
