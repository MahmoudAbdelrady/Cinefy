package com.mdevs.cinefy.dto.showtime;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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

    @Size(max = 255, message = "Special notes cannot be longer than 255 characters")
    @Pattern(regexp = "(?s).*\\S.*", message = "Special notes cannot be only whitespace")
    private String specialNotes;
}
