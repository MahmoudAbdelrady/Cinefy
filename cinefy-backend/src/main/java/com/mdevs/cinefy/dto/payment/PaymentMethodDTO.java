package com.mdevs.cinefy.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentMethodDTO {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Type is required")
    private String type;

    private boolean isTestMode = true;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO 4217 code")
    private String currency;

    @NotBlank(message = "Public key is required")
    private String publicKey;

    private String secretKey;

    private String hmacSecret;

    @NotNull(message = "Integration ID is required")
    @Positive(message = "Integration ID must be greater than 0")
    private Long integrationId;

    private boolean connectionTestRequested = false;
}
