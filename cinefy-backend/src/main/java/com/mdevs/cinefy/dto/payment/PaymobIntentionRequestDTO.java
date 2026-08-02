package com.mdevs.cinefy.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record PaymobIntentionRequestDTO(

        long amount,

        String currency,

        @JsonProperty("payment_methods")
        List<Long> paymentMethods,

        List<Item> items,

        @JsonProperty("billing_data")
        BillingData billingData,

        @JsonProperty("special_reference")
        String specialReference,

        int expiration
) {

    public record Item(

            String name,

            long amount,

            String description,

            int quantity,

            String image
    ) {

    }

    public record BillingData(

            @JsonProperty("first_name")
            String firstName,

            @JsonProperty("last_name")
            String lastName,

            @JsonProperty("phone_number")
            String phoneNumber,

            String email
    ) {

    }
}
