package com.mdevs.cinefy.dto.payment;

import com.mdevs.cinefy.shared.validation.ValidationPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PaymentGatewayProviderDTO<C extends GatewayProviderCredentials, K extends GatewayProviderChannelConfig> {

    private String id;

    @NotBlank(message = "Name is required")
    @Size(max = 60, message = "Name must not exceed 60 characters")
    @Pattern(regexp = ValidationPatterns.RESOURCE_NAME, message = ValidationPatterns.RESOURCE_NAME_MESSAGE)
    private String name;

    @NotBlank(message = "Provider is required")
    private String provider;

    private boolean isActive = false;

    @NotNull(message = "Credentials are required")
    private C credentials;

    private List<PaymentGatewayProviderChannel<K>> paymentChannels;
}
