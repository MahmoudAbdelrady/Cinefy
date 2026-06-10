package com.mdevs.cinefy.dto.movie;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HighlightRequestDTO {

    @NotNull(message = "Highlighted flag is required")
    private Boolean highlighted;
}
