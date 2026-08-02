package com.mdevs.cinefy.dto.payment;

public record CardTokenCallbackDTO(

        String token,

        String maskedPan,

        String brand,

        String email
) implements PaymentCallbackData {

}
