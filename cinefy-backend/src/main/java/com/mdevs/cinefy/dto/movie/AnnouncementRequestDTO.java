package com.mdevs.cinefy.dto.movie;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnnouncementRequestDTO {

    @NotNull(message = "Announced flag is required")
    private Boolean announced;
}
