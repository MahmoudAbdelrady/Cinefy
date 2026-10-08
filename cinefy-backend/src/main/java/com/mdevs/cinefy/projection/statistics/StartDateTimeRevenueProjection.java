package com.mdevs.cinefy.projection.statistics;

import java.math.BigDecimal;
import java.time.Instant;

public record StartDateTimeRevenueProjection(Instant startDateTime, BigDecimal netRevenue, BigDecimal refunded) {
}
