package com.mdevs.cinefy.dto.booking;

import java.time.LocalDateTime;
import java.util.List;

public record ActiveBookingDTO(String id, List<String> positions, LocalDateTime expiresAt) {
}
