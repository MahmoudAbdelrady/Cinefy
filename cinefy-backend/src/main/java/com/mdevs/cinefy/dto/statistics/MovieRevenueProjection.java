package com.mdevs.cinefy.dto.statistics;

import java.math.BigDecimal;

public record MovieRevenueProjection(Long movieId,
                                     String movieTitle,
                                     BigDecimal netRevenue,
                                     BigDecimal refunded,
                                     long totalShowtimes) {
}
