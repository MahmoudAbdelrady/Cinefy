package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum PaymentMethodStatus {
    DRAFT,
    ACTIVE,
    INACTIVE;

    public static PaymentMethodStatus fromString(String name) {
        return Arrays.stream(values())
                .filter(status -> status.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown PaymentMethodStatus: " + name));
    }
}
