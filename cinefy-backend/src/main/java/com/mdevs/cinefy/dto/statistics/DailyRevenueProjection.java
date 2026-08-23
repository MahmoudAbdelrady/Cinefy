package com.mdevs.cinefy.dto.statistics;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyRevenueProjection(LocalDate date, BigDecimal netRevenue, BigDecimal refunded) {
}
