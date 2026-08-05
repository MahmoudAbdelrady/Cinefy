package com.mdevs.cinefy.dto.payment;

public record PaymentGatewayProviderChannel<T extends GatewayProviderChannelConfig>(
        String name,

        String currency,

        boolean isActive,

        T providerConfig
) {

}
