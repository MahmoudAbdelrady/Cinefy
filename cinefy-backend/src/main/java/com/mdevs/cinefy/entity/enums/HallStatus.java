package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;

public enum HallStatus {
    SCHEDULED,
    NOW_SHOWING,
    ACTIVE,
    INACTIVE,
    UNDER_MAINTENANCE;

    public static HallStatus fromString(String name) {
        return Arrays.stream(values())
                .filter(status -> status.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown HallStatus: " + name));
    }
}
