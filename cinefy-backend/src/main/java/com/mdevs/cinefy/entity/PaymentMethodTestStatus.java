package com.mdevs.cinefy.entity;

import java.util.Arrays;

public enum PaymentMethodTestStatus {
    UNTESTED,
    SUCCESS,
    FAILURE;

    public static PaymentMethodTestStatus fromString(String name) {
        return Arrays.stream(values())
                .filter(status -> status.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown PaymentMethodTestStatus: " + name));
    }
}
