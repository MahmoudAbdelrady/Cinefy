package com.mdevs.cinefy.dto.statistics;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class MoviePerformanceDTO {

    private String movieTitle;

    private BigDecimal netRevenue;

    private BigDecimal refunded;

    private long totalShowtimes;

    private long ticketsSold;

    private long totalSeats;
}
