package com.mdevs.cinefy.entity;

import java.util.Arrays;

public enum ShowtimeStatus {
    DRAFT,
    PUBLISHED,
    RUNNING,
    FINISHED,
    CANCELLED;

    public static ShowtimeStatus fromString(String name) {
        return Arrays.stream(values())
                .filter(status -> status.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown ShowtimeStatus: " + name));
    }
}
