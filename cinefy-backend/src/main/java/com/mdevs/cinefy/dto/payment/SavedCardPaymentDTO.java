package com.mdevs.cinefy.dto.payment;

import com.mdevs.cinefy.shared.validation.ValidationPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SavedCardPaymentDTO {

    @NotBlank(message = "Payment method is required")
    @Pattern(regexp = ValidationPatterns.UUID, message = "Payment method must be a valid UUID")
    private String paymentMethodId;
}
