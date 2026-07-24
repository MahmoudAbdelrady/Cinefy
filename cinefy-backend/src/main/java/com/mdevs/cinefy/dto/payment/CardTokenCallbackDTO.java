package com.mdevs.cinefy.dto.payment;

public record CardTokenCallbackDTO(

        String token,

        String maskedPan,

        String name,

        String email
) implements PaymentCallbackData {

}
