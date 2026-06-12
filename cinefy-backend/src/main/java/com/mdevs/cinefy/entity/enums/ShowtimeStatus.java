package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;
import java.util.Set;

public enum ShowtimeStatus {
    DRAFT,
    PUBLISHED,
    RUNNING,
    FINISHED;

    public static final Set<ShowtimeStatus> ACTIVE_STATUSES = Set.of(DRAFT, PUBLISHED);

    public static final Set<ShowtimeStatus> COMMITTED_STATUSES = Set.of(PUBLISHED, RUNNING);

    public static final Set<ShowtimeStatus> LIVE_STATUSES = Set.of(DRAFT, PUBLISHED, RUNNING);

    public static ShowtimeStatus fromString(String name) {
        return Arrays.stream(values())
                .filter(status -> status.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown ShowtimeStatus: " + name));
    }
}
