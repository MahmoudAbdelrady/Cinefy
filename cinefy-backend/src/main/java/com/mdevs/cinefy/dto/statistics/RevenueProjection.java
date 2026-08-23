package com.mdevs.cinefy.dto.statistics;

import java.math.BigDecimal;

public record RevenueProjection(BigDecimal currentNetRevenue,
                                BigDecimal currentRefunded,
                                BigDecimal previousNetRevenue,
                                BigDecimal previousRefunded) {
}
