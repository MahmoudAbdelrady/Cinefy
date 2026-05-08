package com.mdevs.cinefy.dto.payment;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestConnectionRequestDTO {

    private String paymentMethodId;

    private String secretKey;

    @Positive(message = "Integration ID must be greater than 0")
    private Long integrationId;

    @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO 4217 code")
    private String currency;
}
