package com.mdevs.cinefy.dto.payment;

import com.mdevs.cinefy.entity.PaymentGateway;

public record PaymentAttemptDTO(

        PaymentGateway gateway,

        PaymentRedirectionDTO redirection,

        PaymobPayResponseDTO payment
) {

    public static PaymentAttemptDTO redirection(PaymentGateway gateway, PaymentRedirectionDTO redirection) {
        return new PaymentAttemptDTO(gateway, redirection, null);
    }

    public static PaymentAttemptDTO payment(PaymentGateway gateway, PaymobPayResponseDTO payment) {
        return new PaymentAttemptDTO(gateway, null, payment);
    }
}
