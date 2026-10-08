package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum SeatCategory {
    STANDARD,
    VIP,
    AISLE;

    public static SeatCategory fromString(String name) {
        return Arrays.stream(values())
                .filter(category -> category.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown SeatCategory: " + name));
    }
}
