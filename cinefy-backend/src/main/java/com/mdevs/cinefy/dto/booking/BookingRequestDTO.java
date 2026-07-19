package com.mdevs.cinefy.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BookingRequestDTO {

    @NotBlank(message = "Showtime is required")
    private String showtimeId;

    @NotEmpty(message = "At least one seat is required")
    private List<String> seats;
}
