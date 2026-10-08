package com.mdevs.cinefy.dto.booking;

import java.time.Instant;
import java.util.List;

public record ActiveBookingDTO(String id, List<String> seats, Instant expiresAt) {
}
