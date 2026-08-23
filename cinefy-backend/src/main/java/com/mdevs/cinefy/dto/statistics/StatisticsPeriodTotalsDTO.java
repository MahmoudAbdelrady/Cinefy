package com.mdevs.cinefy.dto.statistics;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class StatisticsPeriodTotalsDTO {

    private BigDecimal netRevenue;

    private BigDecimal refunded;

    private long ticketsSold;

    private BigDecimal occupancy;
}
