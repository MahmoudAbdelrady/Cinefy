package com.mdevs.cinefy.dto.payment;

public record TransactionCallbackDTO(

        String id,

        long amountCents,

        boolean success,

        boolean isRefunded,

        boolean isVoided,

        String orderReference
) implements PaymentCallbackData {

}
