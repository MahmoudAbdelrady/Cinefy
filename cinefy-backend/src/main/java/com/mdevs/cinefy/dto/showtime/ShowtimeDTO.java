package com.mdevs.cinefy.dto.showtime;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ShowtimeDTO {

    private Long movieId;

    @NotNull(message = "Date and time are required")
    private LocalDateTime dateTime;

    @NotBlank(message = "Hall is required")
    private String hallId;

    @JsonProperty("is3D")
    private boolean is3D;

    private String specialNotes;
}
