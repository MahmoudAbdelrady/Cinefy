package com.mdevs.cinefy.dto.payment;

public record PaymobPayResponseDTO(

        String id,

        boolean pending,

        boolean success,

        String message,

        String redirectionUrl,

        String orderReference
) {

}
