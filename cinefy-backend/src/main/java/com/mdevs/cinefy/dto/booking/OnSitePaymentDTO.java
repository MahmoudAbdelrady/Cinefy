package com.mdevs.cinefy.dto.booking;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OnSitePaymentDTO {

    @NotNull(message = "Payment type is required")
    @JsonProperty("isCash")
    private Boolean isCash;

    private String transactionId;
}
