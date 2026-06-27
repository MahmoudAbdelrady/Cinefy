package com.mdevs.cinefy.dto.payment;

import com.mdevs.cinefy.shared.validation.ValidationPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentMethodDTO {

    @NotBlank(message = "Name is required")
    @Size(max = 50, message = "Name must not exceed 50 characters")
    @Pattern(regexp = ValidationPatterns.RESOURCE_NAME, message = ValidationPatterns.RESOURCE_NAME_MESSAGE)
    private String name;

    @NotBlank(message = "Type is required")
    private String type;

    private boolean isTestMode = true;

    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter ISO 4217 code")
    private String currency;

    @NotBlank(message = "Public key is required")
    @Pattern(regexp = ValidationPatterns.NO_WHITESPACE, message = "Public key cannot contain whitespace")
    private String publicKey;

    @Pattern(regexp = ValidationPatterns.NO_WHITESPACE, message = "Secret key cannot contain whitespace")
    private String secretKey;

    @Pattern(regexp = ValidationPatterns.NO_WHITESPACE, message = "HMAC secret cannot contain whitespace")
    private String hmacSecret;

    @NotNull(message = "Integration ID is required")
    @Positive(message = "Integration ID must be greater than 0")
    private Long integrationId;

    private boolean connectionTestRequested = false;
}
