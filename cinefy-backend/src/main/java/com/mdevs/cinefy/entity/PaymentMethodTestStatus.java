package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum PaymentMethodTestStatus {
    UNTESTED,
    SUCCESS,
    FAILURE;

    public static PaymentMethodTestStatus fromString(String name) {
        return Arrays.stream(values())
                .filter(status -> status.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown PaymentMethodTestStatus: " + name));
    }
}
