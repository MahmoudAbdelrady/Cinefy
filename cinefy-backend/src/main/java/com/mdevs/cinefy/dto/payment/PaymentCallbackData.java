package com.mdevs.cinefy.dto.payment;

public sealed interface PaymentCallbackData permits TransactionCallbackDTO, CardTokenCallbackDTO {

}
