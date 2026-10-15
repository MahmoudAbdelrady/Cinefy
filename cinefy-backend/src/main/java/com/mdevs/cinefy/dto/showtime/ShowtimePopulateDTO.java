package com.mdevs.cinefy.dto.showtime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShowtimePopulateDTO {

    @NotNull(message = "Movie is required")
    private Long movieId;

    @NotBlank(message = "First hall is required")
    private String firstHallId;

    @NotBlank(message = "Second hall is required")
    private String secondHallId;

    private boolean highlighted = false;
}
