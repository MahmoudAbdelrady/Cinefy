package com.mdevs.cinefy.dto.payment;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentGatewayStatusRequestDTO {

    @NotNull(message = "Active flag is required")
    private Boolean active;
}
