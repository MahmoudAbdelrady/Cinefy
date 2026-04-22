package com.mdevs.cinefy.dto.hall;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HallTypeDTO {

    private String id;

    @NotBlank(message = "Name is required")
    private String name;
}
