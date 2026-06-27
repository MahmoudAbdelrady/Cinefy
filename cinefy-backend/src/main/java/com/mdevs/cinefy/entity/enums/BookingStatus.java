package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum BookingStatus {
    PENDING,
    CONFIRMED,
    REFUNDED;

    public static BookingStatus fromString(String name) {
        return Arrays.stream(values())
                .filter(status -> status.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown BookingStatus: " + name));
    }
}
