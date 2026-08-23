package com.mdevs.cinefy.dto.statistics;

import com.mdevs.cinefy.entity.Hall;

import java.time.LocalDate;

public record DailyHallProjection(LocalDate date, Hall hall) {
}
