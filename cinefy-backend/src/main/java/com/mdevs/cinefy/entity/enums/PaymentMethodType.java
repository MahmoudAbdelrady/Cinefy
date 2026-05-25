package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum PaymentMethodType {
    CARD,
    WALLET,
    INSTALLMENT;

    public static PaymentMethodType fromString(String name) {
        return Arrays.stream(values())
                .filter(type -> type.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown PaymentMethodType: " + name));
    }
}
