package com.mdevs.cinefy.dto.showtime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PopulateShowtimesQuantityDTO {

    @NotNull(message = "First hall quantity is required")
    @Min(value = 1, message = "First hall quantity must be at least 1")
    @Max(value = 10, message = "First hall quantity cannot be more than 10")
    private Integer firstHall;

    @NotNull(message = "Second hall quantity is required")
    @Min(value = 1, message = "Second hall quantity must be at least 1")
    @Max(value = 10, message = "Second hall quantity cannot be more than 10")
    private Integer secondHall;
}
