package com.mdevs.cinefy.entity;

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
                .orElseThrow(() -> new IllegalArgumentException("Unknown HallStatus: " + name));
    }
}
