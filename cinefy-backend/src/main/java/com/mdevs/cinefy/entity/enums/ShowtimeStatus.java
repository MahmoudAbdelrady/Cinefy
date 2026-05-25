package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

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
                .orElseThrow(() -> new BusinessException("Unknown ShowtimeStatus: " + name));
    }
}
