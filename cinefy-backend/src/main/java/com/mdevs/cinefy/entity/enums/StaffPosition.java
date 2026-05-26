package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum StaffPosition {
    ADMIN,
    MANAGER,
    CASHIER,
    USHER;

    public static StaffPosition fromString(String name) {
        return Arrays.stream(values())
                .filter(position -> position.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown StaffPosition: " + name));
    }
}
