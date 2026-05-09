package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum SeatCategory {
    NORMAL,
    VIP,
    AISLE;

    public static SeatCategory fromString(String name) {
        return Arrays.stream(values())
                .filter(category -> category.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown SeatCategory: " + name));
    }
}
