package com.mdevs.cinefy.dto.statistics;

import java.time.LocalDate;

public record DailyTicketsSoldProjection(LocalDate date, long ticketsSold) {
}
