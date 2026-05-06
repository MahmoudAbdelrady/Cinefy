package com.mdevs.cinefy.entity;

import java.util.Arrays;

public enum PaymentProvider {
    PAYMOB;

    public static PaymentProvider fromString(String name) {
        return Arrays.stream(values())
                .filter(provider -> provider.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown PaymentProvider: " + name));
    }
}
