package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum PaymentProvider {
    PAYMOB;

    public static PaymentProvider fromString(String name) {
        return Arrays.stream(values())
                .filter(provider -> provider.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown PaymentProvider: " + name));
    }
}
