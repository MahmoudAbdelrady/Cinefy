package com.mdevs.cinefy.entity;

import java.util.Arrays;

public enum PaymentMethodType {
    CARD,
    WALLET,
    INSTALLMENT;

    public static PaymentMethodType fromString(String name) {
        return Arrays.stream(values())
                .filter(type -> type.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown PaymentMethodType: " + name));
    }
}
