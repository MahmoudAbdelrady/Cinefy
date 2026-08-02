package com.mdevs.cinefy.entity.enums;

import com.mdevs.cinefy.shared.exception.types.BusinessException;

import java.util.Arrays;
import java.util.Set;

public enum BookingStatus {
    PENDING_PAYMENT,
    CONFIRMED,
    REFUNDED;

    private static final Set<BookingStatus> SETTLED_STATUSES = Set.of(CONFIRMED, REFUNDED);

    public static boolean isSettled(BookingStatus status) {
        return status != null && SETTLED_STATUSES.contains(status);
    }

    public static BookingStatus fromString(String name) {
        return Arrays.stream(values())
                .filter(status -> status.name().equals(name))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Unknown BookingStatus: " + name));
    }
}
