package com.mdevs.cinefy.dto.payment;

public record ClientPaymentMethodDTO(

        String id,

        String cardBrand,

        String cardNumber
) {

}
