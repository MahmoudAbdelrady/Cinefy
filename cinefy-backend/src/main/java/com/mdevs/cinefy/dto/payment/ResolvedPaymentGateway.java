package com.mdevs.cinefy.dto.payment;

import com.mdevs.cinefy.entity.PaymentGateway;

import java.util.List;

public record ResolvedPaymentGateway(

        PaymentGateway entity,

        GatewayProviderCredentials credentials,

        List<PaymentGatewayChannel<?>> channels
) {

}
