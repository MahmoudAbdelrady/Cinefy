package com.mdevs.cinefy.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePaymentMethodDTO {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Type is required")
    private String type;

    private boolean isTest = true;

    @NotBlank(message = "Public key is required")
    private String publicKey;

    @NotBlank(message = "Secret key is required")
    private String secretKey;

    @NotBlank(message = "HMAC secret is required")
    private String hmacSecret;

    @NotNull(message = "Integration ID is required")
    @Positive(message = "Integration ID must be greater than 0")
    private Long integrationId;

    private String iframeId;

    private boolean connectionTested = false;
}
