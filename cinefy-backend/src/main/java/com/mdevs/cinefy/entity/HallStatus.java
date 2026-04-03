package com.mdevs.cinefy.entity;

import lombok.Getter;

import java.util.Arrays;

@Getter
public enum HallStatus {
    SCHEDULED("scheduled"),
    NOW_SHOWING("now_showing"),
    ACTIVE("active"),
    INACTIVE("inactive"),
    UNDER_MAINTENANCE("under_maintenance");

    private final String code;

    HallStatus(String code) {
        this.code = code;
    }

    public static HallStatus fromCode(String code) {
        return Arrays.stream(values())
                .filter(status -> status.code.equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown HallStatus code: " + code));
    }
}
