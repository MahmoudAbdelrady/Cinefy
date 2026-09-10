package com.mdevs.cinefy.projection.statistics;

import java.time.LocalDate;

public record DailyTicketsSoldProjection(LocalDate date, long ticketsSold) {
}
