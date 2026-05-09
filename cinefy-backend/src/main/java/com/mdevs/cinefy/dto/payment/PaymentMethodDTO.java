package com.mdevs.cinefy.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @Getter(onMethod_ = @JsonProperty("isTest"))
    @Setter(onMethod_ = @JsonProperty("isTest"))
    private boolean isTest = true;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO 4217 code")
    private String currency;

    @NotBlank(message = "Public key is required")
    private String publicKey;

    @NotBlank(message = "Secret key is required")
    private String secretKey;

    @NotBlank(message = "HMAC secret is required")
    private String hmacSecret;

    @NotNull(message = "Integration ID is required")
    @Positive(message = "Integration ID must be greater than 0")
    private Long integrationId;

    private boolean connectionTestRequested = false;
}
