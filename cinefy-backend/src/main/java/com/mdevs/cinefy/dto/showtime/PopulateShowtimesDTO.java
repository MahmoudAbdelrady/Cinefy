package com.mdevs.cinefy.dto.showtime;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class PopulateShowtimesDTO {

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @Valid
    @NotNull(message = "Quantity is required")
    private PopulateShowtimesQuantityDTO quantity;

    @NotEmpty(message = "At least one movie is required")
    private List<@Valid @NotNull(message = "Movie entry is required") ShowtimePopulateDTO> movies;
}
