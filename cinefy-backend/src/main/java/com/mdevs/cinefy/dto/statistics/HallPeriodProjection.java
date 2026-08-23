package com.mdevs.cinefy.dto.statistics;

import com.mdevs.cinefy.entity.Hall;

public record HallPeriodProjection(Hall hall, boolean inCurrent, boolean inPrevious) {
}
