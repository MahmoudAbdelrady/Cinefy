package com.mdevs.cinefy.dto.payment;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentMethodStatusRequestDTO {

    @NotBlank(message = "Status is required")
    private String status;
}
