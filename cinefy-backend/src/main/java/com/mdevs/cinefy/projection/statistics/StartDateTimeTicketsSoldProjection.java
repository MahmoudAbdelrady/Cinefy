package com.mdevs.cinefy.projection.statistics;

import java.time.Instant;

public record StartDateTimeTicketsSoldProjection(Instant startDateTime, long ticketsSold) {
}
