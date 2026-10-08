package com.mdevs.cinefy.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Component
public class DateUtil {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final ZoneId cinemaZoneId;

    public DateUtil(@Value("${app.cinema-time-zone}") String cinemaTimeZone) {
        this.cinemaZoneId = ZoneId.of(cinemaTimeZone);
    }

    public LocalDate today() {
        return LocalDate.now(cinemaZoneId);
    }

    public LocalDateTime now() {
        return LocalDateTime.now(cinemaZoneId);
    }

    public LocalDate toCinemaDate(Instant instant) {
        return instant.atZone(cinemaZoneId).toLocalDate();
    }

    public LocalDateTime toCinemaDateTime(Instant instant) {
        return instant.atZone(cinemaZoneId).toLocalDateTime();
    }

    public String formatTime(Instant instant) {
        return instant.atZone(cinemaZoneId).format(TIME_FORMATTER);
    }

    public Instant toInstant(LocalDateTime cinemaDateTime) {
        return cinemaDateTime.atZone(cinemaZoneId).toInstant();
    }

    public Instant startOfDay(LocalDate date) {
        return date.atStartOfDay(cinemaZoneId).toInstant();
    }

    public Instant endOfDay(LocalDate date) {
        return date.atTime(LocalTime.MAX).atZone(cinemaZoneId).toInstant();
    }
}
