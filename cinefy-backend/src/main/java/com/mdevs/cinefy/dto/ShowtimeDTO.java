package com.mdevs.cinefy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ShowtimeDTO {

    @NotNull(message = "Movie is required")
    private Long movieId;

    @NotNull(message = "Date and time are required")
    private LocalDateTime dateTime;

    @NotBlank(message = "Hall is required")
    private String hallId;

    private boolean is3D;

    private String specialNotes;
}
