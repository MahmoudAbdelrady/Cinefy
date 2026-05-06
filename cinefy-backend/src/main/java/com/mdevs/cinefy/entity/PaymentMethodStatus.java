package com.mdevs.cinefy.entity;

import java.util.Arrays;

public enum PaymentMethodStatus {
    DRAFT,
    ACTIVE,
    DISABLED;

    public static PaymentMethodStatus fromString(String name) {
        return Arrays.stream(values())
                .filter(status -> status.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown PaymentMethodStatus: " + name));
    }
}
