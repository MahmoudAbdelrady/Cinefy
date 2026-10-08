package com.mdevs.cinefy.projection.statistics;

import com.mdevs.cinefy.entity.Hall;

import java.time.Instant;

public record ShowtimeHallProjection(Instant startDateTime, Hall hall) {
}
