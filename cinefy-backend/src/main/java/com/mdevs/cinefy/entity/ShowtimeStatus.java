package com.mdevs.cinefy.entity;

import java.util.Arrays;
import java.util.Set;

public enum ShowtimeStatus {
    DRAFT,
    PUBLISHED,
    RUNNING,
    FINISHED,
    CANCELLED;

    public static final Set<ShowtimeStatus> ACTIVE_STATUSES = Set.of(DRAFT, PUBLISHED);

    public static ShowtimeStatus fromString(String name) {
        return Arrays.stream(values())
                .filter(status -> status.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown ShowtimeStatus: " + name));
    }
}
