package com.mdevs.cinefy.dto.payment;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
public class PaymentMethodDetailDTO {

    private String id;

    private String name;

    private String type;

    @Getter(onMethod_ = @JsonProperty("isTest"))
    @Setter(onMethod_ = @JsonProperty("isTest"))
    private boolean isTest;

    private String currency;

    private String publicKey;

    private long integrationId;

    private String testStatus;

    private String testFailureReason;
}
