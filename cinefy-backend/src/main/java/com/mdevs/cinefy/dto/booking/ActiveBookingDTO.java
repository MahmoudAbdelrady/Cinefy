package com.mdevs.cinefy.dto.booking;

import java.time.LocalDateTime;
import java.util.List;

public record ActiveBookingDTO(List<String> positions, LocalDateTime expiresAt) {
}
